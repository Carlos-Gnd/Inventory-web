import api from './api';
import { Producto, ApiResponse } from '../types';

export const productoService = {
  listar: async () => {
    const { data } = await api.get<Producto[]>('/productos');
    return data;
  },

  listarActivos: async () => {
    const { data } = await api.get<Producto[]>('/productos');
    return data.filter((p: Producto) => p.Estado && p.Stock > 0);
  },

  obtenerStockBajo: async () => {
    const { data } = await api.get<Producto[]>('/productos/stock-bajo');
    return data;
  },

  registrar: async (producto: Partial<Producto>) => {
    const { data } = await api.post<ApiResponse>('/productos', producto);
    return data;
  },

  editar: async (id: number, producto: Partial<Producto>) => {
    const { data } = await api.put<ApiResponse>(`/productos/${id}`, producto);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/productos/${id}`);
    return data;
  },

  actualizarStock: async (id: number, cantidad: number) => {
    const { data } = await api.patch<ApiResponse>(`/productos/${id}/stock`, { cantidad });
    return data;
  }
};