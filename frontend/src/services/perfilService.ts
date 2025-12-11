// frontend/src/services/perfilService.ts - MEJORADO
import api from './api';
import { Usuario, ActualizarPerfilRequest } from '../types';

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

interface CambiarClaveResponse {
  message: string;
}

export const perfilService = {
  // ==================== MÉTODOS PARA USUARIO COMÚN ====================
  
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

  // Cambiar MI contraseña
  cambiarMiClave: async (claveActual: string, claveNueva: string): Promise<CambiarClaveResponse> => {
    const { data } = await api.put<CambiarClaveResponse>('/perfil/mi-perfil/cambiar-clave', {
      claveActual,
      claveNueva
    });
    return data;
  },

  // ==================== MÉTODOS PARA ADMIN ====================
  
  // Obtener perfil de otro usuario (solo admin)
  obtenerPerfilUsuario: async (idUsuario: number): Promise<Usuario> => {
    const { data } = await api.get<Usuario>(`/perfil/usuarios/${idUsuario}`);
    return data;
  },

  // Actualizar perfil de otro usuario (solo admin)
  actualizarPerfilUsuario: async (
    idUsuario: number, 
    datos: ActualizarPerfilRequest
  ): Promise<ActualizarPerfilResponse> => {
    const { data } = await api.put<ActualizarPerfilResponse>(
      `/perfil/usuarios/${idUsuario}`,
      datos
    );
    return data;
  },

  // Cambiar contraseña de otro usuario (solo admin)
  cambiarClaveUsuario: async (
    idUsuario: number, 
    claveNueva: string
  ): Promise<CambiarClaveResponse> => {
    const { data } = await api.put<CambiarClaveResponse>(
      `/perfil/usuarios/${idUsuario}/cambiar-clave`,
      { claveNueva }
    );
    return data;
  },

  // ==================== UTILIDADES ====================

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
  },

  // Comprimir imagen antes de subir (opcional)
  comprimirImagen: async (file: File, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result as string);
              } else {
                reject(new Error('Error al comprimir imagen'));
              }
            },
            file.type,
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }
};