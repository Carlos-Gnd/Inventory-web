// frontend/src/services/perfilService.ts - ACTUALIZADO

import api from './api';
import { Usuario, ActualizarPerfilRequest } from '../types';

// Interfaces para las respuestas
interface ActualizarPerfilResponse {
  message: string;
  usuario: Usuario;
}

interface ActualizarFotoResponse {
  message: string;
  FotoPerfil: string;
}

interface EliminarFotoResponse {
  message: string;
}

export const perfilService = {
  // Obtener perfil del usuario actual
  obtenerMiPerfil: async (): Promise<Usuario> => {
    const { data } = await api.get<Usuario>('/perfil/mi-perfil');
    return data;
  },

  // Actualizar perfil completo
  actualizarMiPerfil: async (datos: ActualizarPerfilRequest): Promise<ActualizarPerfilResponse> => {
    const { data } = await api.put<ActualizarPerfilResponse>('/perfil/mi-perfil', datos);
    return data;
  },

  // Actualizar solo la foto
  actualizarFoto: async (fotoBase64: string): Promise<ActualizarFotoResponse> => {
    const { data } = await api.put<ActualizarFotoResponse>(
      '/perfil/mi-perfil/foto',
      { FotoPerfil: fotoBase64 }
    );
    return data;
  },

  // Eliminar foto
  eliminarFoto: async (): Promise<EliminarFotoResponse> => {
    const { data } = await api.delete<EliminarFotoResponse>('/perfil/mi-perfil/foto');
    return data;
  },

  // Convertir archivo a base64
  convertirABase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  },

  // Validar tamaño de imagen (max 2MB)
  validarTamañoImagen: (file: File): boolean => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    return file.size <= maxSize;
  },

  // Validar tipo de archivo
  validarTipoImagen: (file: File): boolean => {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return tiposPermitidos.includes(file.type);
  }
};