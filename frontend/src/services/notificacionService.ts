// frontend/src/services/notificacionService.ts
import api from './api';
import { Notificacion, EstadisticasNotificaciones } from '../types';

interface FiltrosNotificaciones {
  leida?: boolean;
  prioridad?: string;
  tipo?: string;
  limite?: number;
}

export const notificacionService = {
  // Listar notificaciones
  listar: async (filtros?: FiltrosNotificaciones): Promise<Notificacion[]> => {
    const params = new URLSearchParams();
    
    if (filtros?.leida !== undefined) {
      params.append('leida', filtros.leida.toString());
    }
    if (filtros?.prioridad) {
      params.append('prioridad', filtros.prioridad);
    }
    if (filtros?.tipo) {
      params.append('tipo', filtros.tipo);
    }
    if (filtros?.limite) {
      params.append('limite', filtros.limite.toString());
    }
    
    const { data } = await api.get<Notificacion[]>(
      `/notificaciones?${params.toString()}`
    );
    return data;
  },

  // Obtener solo no leídas
  listarNoLeidas: async (): Promise<Notificacion[]> => {
    // Pasamos el flag 'x-silent-error' para que si falla, no cierre la sesión
    const { data } = await api.get<Notificacion[]>(
      '/notificaciones?leida=false&limite=50', 
      {
        headers: { 'x-silent-error': 'true' }
      }
    );
    return data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (): Promise<EstadisticasNotificaciones> => {
    const { data } = await api.get<EstadisticasNotificaciones>('/notificaciones/estadisticas');
    return data;
  },

  // Marcar como leída
  marcarLeida: async (idNotificacion: number): Promise<void> => {
    await api.put(`/notificaciones/${idNotificacion}/leer`);
  },

  // Marcar todas como leídas
  marcarTodasLeidas: async (): Promise<number> => {
    const { data } = await api.put<{ count: number }>('/notificaciones/leer-todas');
    return data.count;
  },

  // Eliminar notificación (solo admin)
  eliminar: async (idNotificacion: number): Promise<void> => {
    await api.delete(`/notificaciones/${idNotificacion}`);
  },

  // Limpiar antiguas (solo admin)
  limpiarAntiguas: async (): Promise<number> => {
    const { data } = await api.delete<{ count: number }>('/notificaciones/limpiar/antiguas');
    return data.count;
  }
};