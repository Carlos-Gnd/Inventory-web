// frontend/src/store/notificacionStore.ts
import { create } from 'zustand';
import { Notificacion } from '../types';
import { notificacionService } from '../services/notificacionService';
import toast from 'react-hot-toast';

interface NotificacionState {
  notificaciones: Notificacion[];
  noLeidas: number;
  loading: boolean;
  ultimaActualizacion: Date | null;
  
  // Actions
  fetchNotificaciones: () => Promise<void>;
  marcarLeida: (idNotificacion: number) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminar: (idNotificacion: number) => Promise<void>;
  
  // Polling
  iniciarPolling: () => void;
  detenerPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useNotificacionStore = create<NotificacionState>((set, get) => ({
  notificaciones: [],
  noLeidas: 0,
  loading: false,
  ultimaActualizacion: null,

  // Fetch notificaciones
  fetchNotificaciones: async () => {
    try {
      set({ loading: true });
      const notificaciones = await notificacionService.listarNoLeidas();
      
      const noLeidas = notificaciones.filter(n => !n.Leida).length;
      
      // Detectar nuevas notificaciones críticas para mostrar toast
      const estadoAnterior = get().notificaciones;
      const nuevasCriticas = notificaciones.filter(n => 
        n.Prioridad === 'critica' && 
        !n.Leida && 
        !estadoAnterior.some(old => old.IdNotificacion === n.IdNotificacion)
      );
      
      // Mostrar toast solo para notificaciones críticas nuevas
      nuevasCriticas.forEach(notif => {
        toast.error(notif.Titulo, {
          icon: '⚠️',
          duration: 5000,
        });
      });
      
      set({ 
        notificaciones, 
        noLeidas,
        ultimaActualizacion: new Date(),
        loading: false 
      });
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      set({ loading: false });
    }
  },

  // Marcar como leída
  marcarLeida: async (idNotificacion: number) => {
    try {
      await notificacionService.marcarLeida(idNotificacion);
      
      set(state => ({
        notificaciones: state.notificaciones.map(n =>
          n.IdNotificacion === idNotificacion ? { ...n, Leida: true } : n
        ),
        noLeidas: Math.max(0, state.noLeidas - 1)
      }));
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      toast.error('Error al marcar notificación');
    }
  },

  // Marcar todas como leídas
  marcarTodasLeidas: async () => {
    try {
      const count = await notificacionService.marcarTodasLeidas();
      
      set(state => ({
        notificaciones: state.notificaciones.map(n => ({ ...n, Leida: true })),
        noLeidas: 0
      }));
      
      if (count > 0) {
        toast.success(`${count} notificaciones marcadas como leídas`);
      }
    } catch (error) {
      console.error('Error al marcar todas:', error);
      toast.error('Error al marcar notificaciones');
    }
  },

  // Eliminar notificación
  eliminar: async (idNotificacion: number) => {
    try {
      await notificacionService.eliminar(idNotificacion);
      
      set(state => {
        const notifEliminada = state.notificaciones.find(n => n.IdNotificacion === idNotificacion);
        const noLeidas = notifEliminada && !notifEliminada.Leida 
          ? Math.max(0, state.noLeidas - 1)
          : state.noLeidas;
        
        return {
          notificaciones: state.notificaciones.filter(n => n.IdNotificacion !== idNotificacion),
          noLeidas
        };
      });
      
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast.error('Error al eliminar notificación');
    }
  },

  // Iniciar polling cada 30 segundos
  iniciarPolling: () => {
    // Fetch inicial
    get().fetchNotificaciones();
    
    // Detener polling anterior si existe
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Iniciar nuevo polling cada 30 segundos
    pollingInterval = setInterval(() => {
      get().fetchNotificaciones();
    }, 30000); // 30 segundos
  },

  // Detener polling
  detenerPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
}));