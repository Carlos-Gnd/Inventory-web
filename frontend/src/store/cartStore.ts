import { create } from 'zustand'
import { Producto, DetalleVenta } from '../types'

interface CartState {
  items: DetalleVenta[]
  subtotal: number
  descuento: number
  total: number
  
  // Actions
  addItem: (producto: Producto, cantidad: number) => void
  removeItem: (idProducto: number) => void
  updateQuantity: (idProducto: number, cantidad: number) => void
  setDescuento: (descuento: number) => void
  clearCart: () => void
  calcularTotales: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  descuento: 0,
  total: 0,

  addItem: (producto: Producto, cantidad: number) => {
    const { items } = get()
    const existingItem = items.find(item => item.IdProducto === producto.IdProducto)

    if (existingItem) {
      // Update quantity if item already exists
      set({
        items: items.map(item =>
          item.IdProducto === producto.IdProducto
            ? {
                ...item,
                Cantidad: item.Cantidad + cantidad,
                Subtotal: (item.Cantidad + cantidad) * item.PrecioUnitario
              }
            : item
        )
      })
    } else {
      // Add new item
      const newItem: DetalleVenta = {
        IdProducto: producto.IdProducto!,
        Producto: producto,
        Cantidad: cantidad,
        PrecioUnitario: producto.Precio,
        Subtotal: cantidad * producto.Precio
      }
      
      set({ items: [...items, newItem] })
    }

    get().calcularTotales()
  },

  removeItem: (idProducto: number) => {
    const { items } = get()
    set({ items: items.filter(item => item.IdProducto !== idProducto) })
    get().calcularTotales()
  },

  updateQuantity: (idProducto: number, cantidad: number) => {
    const { items } = get()
    
    if (cantidad <= 0) {
      get().removeItem(idProducto)
      return
    }

    set({
      items: items.map(item =>
        item.IdProducto === idProducto
          ? {
              ...item,
              Cantidad: cantidad,
              Subtotal: cantidad * item.PrecioUnitario
            }
          : item
      )
    })

    get().calcularTotales()
  },

  setDescuento: (descuento: number) => {
    set({ descuento })
    get().calcularTotales()
  },

  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      descuento: 0,
      total: 0
    })
  },

  calcularTotales: () => {
    const { items, descuento } = get()
    const subtotal = items.reduce((sum, item) => sum + item.Subtotal, 0)
    const total = Math.max(0, subtotal - descuento)
    
    set({ subtotal, total })
  }
}))