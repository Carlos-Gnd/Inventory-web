// frontend/src/services/historialSesionService.ts
import api from './api';
import { HistorialSesion, EstadisticasSesiones } from '../types';

export const historialSesionService = {
  listar: async (limite?: number) => {
    const { data } = await api.get<HistorialSesion[]>('/historial-sesiones', {
      params: { limite }
    });
    return data;
  },

  listarPorUsuario: async (idUsuario: number, limite?: number) => {
    const { data } = await api.get<HistorialSesion[]>(
      `/historial-sesiones/usuario/${idUsuario}`,
      { params: { limite } }
    );
    return data;
  },

  obtenerEstadisticas: async (idUsuario?: number) => {
    const url = idUsuario 
      ? `/historial-sesiones/estadisticas/${idUsuario}`
      : '/historial-sesiones/estadisticas';
    
    const { data } = await api.get<EstadisticasSesiones>(url);
    return data;
  }
};