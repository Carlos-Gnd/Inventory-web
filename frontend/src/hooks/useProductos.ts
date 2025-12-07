// frontend/src/hooks/useProductos.ts
import { useState, useEffect } from 'react';
import { productoService } from '../services/productoService';
import { Producto } from '../types';
import toast from 'react-hot-toast';

export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productoService.listar();
      setProductos(data);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al cargar productos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createProducto = async (producto: Partial<Producto>) => {
    try {
      await productoService.registrar(producto);
      toast.success('Producto creado exitosamente');
      await fetchProductos();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al crear producto';
      toast.error(message);
      return false;
    }
  };

  const updateProducto = async (id: number, producto: Partial<Producto>) => {
    try {
      await productoService.editar(id, producto);
      toast.success('Producto actualizado exitosamente');
      await fetchProductos();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al actualizar producto';
      toast.error(message);
      return false;
    }
  };

  const deleteProducto = async (id: number) => {
    try {
      await productoService.eliminar(id);
      toast.success('Producto eliminado exitosamente');
      await fetchProductos();
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al eliminar producto';
      toast.error(message);
      return false;
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return {
    productos,
    loading,
    error,
    refetch: fetchProductos,
    createProducto,
    updateProducto,
    deleteProducto
  };
};

