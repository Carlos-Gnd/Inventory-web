// frontend/src/services/categoriaService.ts
import api from './api';
import { Categoria, ApiResponse } from '../types';

export const categoriaService = {
  listar: async () => {
    const { data } = await api.get<Categoria[]>('/categorias');
    return data;
  },

  registrar: async (categoria: Partial<Categoria>) => {
    const { data } = await api.post<ApiResponse>('/categorias', categoria);
    return data;
  },

  editar: async (id: number, categoria: Partial<Categoria>) => {
    const { data } = await api.put<ApiResponse>(`/categorias/${id}`, categoria);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/categorias/${id}`);
    return data;
  }
};