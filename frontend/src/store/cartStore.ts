import { create } from 'zustand';
import { Producto, DetalleVenta, VentaDescuento } from '../types';
import descuentoService from '../services/descuentoService';
import toast from 'react-hot-toast';

interface CartState {
  items: DetalleVenta[];
  subtotal: number;
  descuentoTotal: number;
  total: number;
  
  // Estado del cupón
  cuponAplicado: string | null;
  descuentosAplicados: VentaDescuento[];

  // Actions
  addItem: (producto: Producto, cantidad: number) => void;
  removeItem: (idProducto: number) => void;
  updateQuantity: (idProducto: number, cantidad: number) => void;
  clearCart: () => void;
  
  // Nuevas acciones para cupones
  aplicarCupon: (codigo: string) => Promise<boolean>;
  removerCupon: () => void;
  
  calcularTotales: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  descuentoTotal: 0,
  total: 0,
  cuponAplicado: null,
  descuentosAplicados: [],

  addItem: (producto, cantidad) => {
    // ... (Tu lógica de agregar item existente no cambia) ...
    const { items } = get();
    const existingItem = items.find(item => item.IdProducto === producto.IdProducto);
    if (existingItem) {
      set({
        items: items.map(item =>
          item.IdProducto === producto.IdProducto
            ? { ...item, Cantidad: item.Cantidad + cantidad, Subtotal: (item.Cantidad + cantidad) * item.PrecioUnitario }
            : item
        )
      });
    } else {
      const newItem: DetalleVenta = {
        IdProducto: producto.IdProducto!,
        Producto: producto,
        Cantidad: cantidad,
        PrecioUnitario: producto.Precio,
        Subtotal: cantidad * producto.Precio
      };
      set({ items: [...items, newItem] });
    }
    get().calcularTotales();
  },

  removeItem: (idProducto) => {
    set({ items: get().items.filter(item => item.IdProducto !== idProducto) });
    get().calcularTotales();
  },

  updateQuantity: (idProducto, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(idProducto);
      return;
    }
    set({
      items: get().items.map(item =>
        item.IdProducto === idProducto
          ? { ...item, Cantidad: cantidad, Subtotal: cantidad * item.PrecioUnitario }
          : item
      )
    });
    get().calcularTotales();
  },

  aplicarCupon: async (codigo: string) => {
    const { subtotal, cuponAplicado } = get();
    
    if (cuponAplicado === codigo) {
      toast.error('Este cupón ya está aplicado');
      return false;
    }

    try {
      const resultado = await descuentoService.validarCupon(codigo, subtotal);

      if (resultado.valido && resultado.descuento) {
        const desc = resultado.descuento;
        let montoDescuento = 0;

        if (desc.Tipo === 'porcentaje') {
          montoDescuento = subtotal * ((desc.Valor || 0) / 100);
        } else if (desc.Tipo === 'monto_fijo') {
          montoDescuento = desc.Valor || 0;
        }

        const infoDescuento: VentaDescuento = {
            IdVenta: 0, // Se asigna al guardar
            IdDescuento: desc.IdDescuento!,
            MontoDescuento: montoDescuento,
            TipoDescuento: desc.Tipo,
            DescripcionDescuento: desc.Nombre
        };

        set({ 
          cuponAplicado: codigo,
          descuentosAplicados: [infoDescuento]
        });
        
        get().calcularTotales();
        toast.success(`Cupón "${desc.Nombre}" aplicado`);
        return true;
      } else {
        toast.error(resultado.mensaje || 'Cupón inválido');
        return false;
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al validar el cupón');
      return false;
    }
  },

  removerCupon: () => {
    set({ cuponAplicado: null, descuentosAplicados: [] });
    get().calcularTotales();
    toast('Cupón removido', { icon: '🗑️' });
  },

  calcularTotales: () => {
    const { items, descuentosAplicados } = get();
    const subtotal = items.reduce((sum, item) => sum + item.Subtotal, 0);
    
    let descuentoTotal = 0;
    
    // Recalcular monto si cambia el subtotal
    if (descuentosAplicados.length > 0) {
        const desc = descuentosAplicados[0]; 
        descuentoTotal = desc.MontoDescuento;
        
        // Evitar que el descuento sea mayor al total
        if (descuentoTotal > subtotal) descuentoTotal = subtotal;
        
        // Actualizamos el objeto en el estado también
        desc.MontoDescuento = descuentoTotal;
    }

    const total = Math.max(0, subtotal - descuentoTotal);
    
    set({ subtotal, descuentoTotal, total, descuentosAplicados });
  },

  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      descuentoTotal: 0,
      total: 0,
      cuponAplicado: null,
      descuentosAplicados: []
    });
  }
}));