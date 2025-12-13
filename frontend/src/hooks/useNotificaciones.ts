// frontend/src/hooks/useNotificaciones.ts
import { useState, useEffect, useCallback } from 'react';
import { notificacionService } from '../services/notificacionService';
import { Notificacion } from '../types';
import toast from 'react-hot-toast';

interface UseNotificacionesOptions {
  filtros?: {
    leida?: boolean;
    prioridad?: string;
    tipo?: string;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotificaciones(options: UseNotificacionesOptions = {}) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificaciones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificacionService.listar(options.filtros);
      setNotificaciones(data);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al cargar notificaciones';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [options.filtros]);

  useEffect(() => {
    fetchNotificaciones();

    // Auto-refresh si está habilitado
    if (options.autoRefresh) {
      const interval = setInterval(
        fetchNotificaciones,
        options.refreshInterval || 30000
      );
      return () => clearInterval(interval);
    }
  }, [fetchNotificaciones, options.autoRefresh, options.refreshInterval]);

  const marcarLeida = async (idNotificacion: number) => {
    try {
      await notificacionService.marcarLeida(idNotificacion);
      setNotificaciones(prev =>
        prev.map(n =>
          n.IdNotificacion === idNotificacion ? { ...n, Leida: true } : n
        )
      );
      return true;
    } catch (error) {
      toast.error('Error al marcar notificación');
      return false;
    }
  };

  const eliminar = async (idNotificacion: number) => {
    try {
      await notificacionService.eliminar(idNotificacion);
      setNotificaciones(prev =>
        prev.filter(n => n.IdNotificacion !== idNotificacion)
      );
      toast.success('Notificación eliminada');
      return true;
    } catch (error) {
      toast.error('Error al eliminar notificación');
      return false;
    }
  };

  return {
    notificaciones,
    loading,
    error,
    refetch: fetchNotificaciones,
    marcarLeida,
    eliminar
  };
}