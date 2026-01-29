// frontend/src/services/ventaService.ts
import api from './api';
import { Venta, DetalleVenta, ApiResponse } from '../types';
import { useAuthStore } from '../store/authStore';

export const ventaService = {
  listar: async () => {
    const { data } = await api.get<Venta[]>('/ventas');
    return data;
  },

  listarPorUsuario: async (idUsuario: number) => {
    const { data } = await api.get<Venta[]>(`/ventas/usuario/${idUsuario}`);
    return data;
  },

  listarPorFechas: async (fechaInicio: string, fechaFin: string) => {
    const { data } = await api.get<Venta[]>('/ventas/fechas', {
      params: { fechaInicio, fechaFin }
    });
    return data;
  },

  obtenerDetalle: async (idVenta: number) => {
    const { data } = await api.get<DetalleVenta[]>(`/ventas/${idVenta}/detalle`);
    return data;
  },

  registrar: async (venta: Partial<Venta>) => {
    const { data } = await api.post<ApiResponse<{ idVenta: number }>>('/ventas', venta);
    return data;
  },

  verificarStock: async (idProducto: number, cantidad: number) => {
    const { data } = await api.post<{ disponible: boolean; mensaje: string }>('/ventas/verificar-stock', {
      IdProducto: idProducto,
      Cantidad: cantidad
    });
    return data;
  },

  imprimirTicket: (idVenta: number) => {
    // Obtener el token actual
    const token = useAuthStore.getState().token;
    
    // Adjuntarlo a la URL
    const url = `${api.defaults.baseURL}/ventas/${idVenta}/ticket?token=${token}`;
    
    // Abrir ventana
    window.open(url, 'Ticket', 'width=400,height=600');
  },
};