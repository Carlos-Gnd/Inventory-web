import api from './api';
import { Usuario, ApiResponse } from '../types';

export const usuarioService = {
  listar: async () => {
    const { data } = await api.get<Usuario[]>('/usuarios');
    return data;
  },

  registrar: async (usuario: Partial<Usuario>) => {
    const { data } = await api.post<ApiResponse>('/usuarios', usuario);
    return data;
  },

  editar: async (id: number, usuario: Partial<Usuario>) => {
    const { data } = await api.put<ApiResponse>(`/usuarios/${id}`, usuario);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/usuarios/${id}`);
    return data;
  },

  cambiarClave: async (id: number, nuevaClave: string) => {
    const { data } = await api.put<ApiResponse>(`/usuarios/${id}/cambiar-clave`, { nuevaClave });
    return data;
  }
};
