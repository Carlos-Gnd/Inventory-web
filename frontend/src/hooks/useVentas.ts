// frontend/src/hooks/useVentas.ts
import { useState, useEffect } from 'react';
import { ventaService } from '../services/ventaService';
import { Venta } from '../types';
import toast from 'react-hot-toast';

export const useVentas = (idUsuario?: number) => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = idUsuario
        ? await ventaService.listarPorUsuario(idUsuario)
        : await ventaService.listar();
      setVentas(data);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al cargar ventas';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createVenta = async (venta: Partial<Venta>) => {
    try {
      await ventaService.registrar(venta);
      toast.success('Venta registrada exitosamente');
      await fetchVentas();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al registrar venta';
      toast.error(message);
      return false;
    }
  };

  useEffect(() => {
    fetchVentas();
  }, [idUsuario]);

  return {
    ventas,
    loading,
    error,
    refetch: fetchVentas,
    createVenta
  };
};

