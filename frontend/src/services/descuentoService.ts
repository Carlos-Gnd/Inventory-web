// frontend/src/services/descuentoService.ts
import api from './api';
import { Descuento, DescuentoAplicado } from '../types';

export interface AplicarDescuentosRequest {
  items: Array<{
    IdProducto: number;
    Cantidad: number;
    PrecioUnitario: number;
  }>;
  subtotal: number;
  codigoCupon?: string;
}

export interface AplicarDescuentosResponse {
  descuentosAplicados: DescuentoAplicado[];
  totalDescuento: number;
  subtotal: number;
  total: number;
}

export interface EstadisticasDescuentos {
  TotalDescuentos: number;
  Activos: number;
  TotalUsos: number;
  MontoTotalDescontado: number;
  VentasConDescuento: number;
  TopDescuentos: Array<{
    Nombre: string;
    Tipo: string;
    Usos: number;
    MontoTotal: number;
  }>;
}

const descuentoService = {
  // Listar todos los descuentos
  listar: async (): Promise<Descuento[]> => {
    const response = await api.get('/descuentos');
    return response.data;
  },

  // Obtener descuentos activos
  obtenerActivos: async (): Promise<Descuento[]> => {
    const response = await api.get('/descuentos/activos');
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id: number): Promise<Descuento> => {
    const response = await api.get(`/descuentos/${id}`);
    return response.data;
  },

  // Crear descuento
  crear: async (descuento: Partial<Descuento>): Promise<{ IdDescuento: number }> => {
    const response = await api.post('/descuentos', descuento);
    return response.data;
  },

  // Actualizar descuento
  actualizar: async (id: number, descuento: Partial<Descuento>): Promise<void> => {
    await api.put(`/descuentos/${id}`, descuento);
  },

  // Eliminar descuento
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/descuentos/${id}`);
  },

  // Cambiar estado
  cambiarEstado: async (id: number, activo: boolean): Promise<void> => {
    await api.patch(`/descuentos/${id}/estado`, { activo });
  },

  // Validar cupón
  validarCupon: async (codigo: string, montoCompra: number): Promise<{
    valido: boolean;
    mensaje: string;
    descuento: Descuento | null;
  }> => {
    // Enviamos codigo Y montoCompra
    const response = await api.post('/descuentos/validar-cupon', { 
        codigo, 
        montoCompra 
    });
    return response.data;
  },

  // Aplicar descuentos al carrito
  aplicarDescuentos: async (request: AplicarDescuentosRequest): Promise<AplicarDescuentosResponse> => {
    const response = await api.post('/descuentos/aplicar', request);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (): Promise<EstadisticasDescuentos> => {
    const response = await api.get('/descuentos/estadisticas/resumen');
    return response.data;
  }
};

export default descuentoService;