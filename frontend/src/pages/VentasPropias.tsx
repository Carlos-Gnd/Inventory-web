// frontend/src/pages/VentasPropias.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { ventaService } from '../services/ventaService';
import { Venta, DetalleVenta } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import SearchBar from '../components/common/SearchBar';
import { Eye, Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

export default function VentasPropias() {
  const { user } = useAuthStore();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<DetalleVenta[]>([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('Todos');

  useEffect(() => {
    fetchVentas();
  }, []);

  useEffect(() => {
    filterVentas();
  }, [debouncedSearch, ventas, metodoPagoFiltro]);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const data = await ventaService.listarPorUsuario(user!.IdUsuario!);
      setVentas(data);
      setFilteredVentas(data);
    } catch (error) {
      toast.error('Error al cargar tus ventas');
    } finally {
      setLoading(false);
    }
  };

  const filterVentas = () => {
    let filtered = [...ventas];

    // Filtro por búsqueda
    if (debouncedSearch) {
      filtered = filtered.filter(
        (v) =>
          v.IdVenta?.toString().includes(debouncedSearch) ||
          (v.Comentario && v.Comentario.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          v.MetodoPago.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Filtro por método de pago
    if (metodoPagoFiltro !== 'Todos') {
      filtered = filtered.filter((v) => v.MetodoPago === metodoPagoFiltro);
    }

    setFilteredVentas(filtered);
  };

  const handleVerDetalle = async (venta: Venta) => {
    try {
      const detalle = await ventaService.obtenerDetalle(venta.IdVenta!);
      setDetalleVenta(detalle);
      setVentaSeleccionada(venta);
      setDetalleModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar detalle');
    }
  };

  const handleFiltrarPorFechas = async () => {
    setLoading(true);
    try {
      const data = await ventaService.listarPorFechas(fechaInicio, fechaFin);
      // Filtrar solo las ventas del usuario actual
      const misDatos = data.filter((v) => v.IdUsuario === user!.IdUsuario!);
      setVentas(misDatos);
      setFilteredVentas(misDatos);
      toast.success(`${misDatos.length} ventas encontradas`);
    } catch (error) {
      toast.error('Error al filtrar ventas');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'IdVenta', header: 'ID', width: '80px' },
    {
      key: 'FechaVenta',
      header: 'Fecha y Hora',
      render: (v: Venta) => formatDateTime(v.FechaVenta!)
    },
    {
      key: 'Total',
      header: 'Total',
      render: (v: Venta) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(v.Total)}
        </span>
      )
    },
    { key: 'MetodoPago', header: 'Método de Pago' },
    {
      key: 'CantidadTotalProductos',
      header: 'Productos',
      render: (v: Venta) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <span>{v.CantidadTotalProductos || 0}</span>
        </div>
      )
    },
    {
      key: 'Estado',
      header: 'Estado',
      render: (v: Venta) => (
        <Badge variant={v.Estado ? 'success' : 'danger'}>
          {v.Estado ? 'Activo' : 'Anulado'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '100px',
      render: (venta: Venta) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVerDetalle(venta);
          }}
          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Ver Detalle"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  // Calcular estadísticas personales
  const totalVentas = filteredVentas.filter((v) => v.Estado).length;
  const montoTotal = filteredVentas.filter((v) => v.Estado).reduce((sum, v) => sum + v.Total, 0);
  const totalProductos = filteredVentas.filter((v) => v.Estado).reduce((sum, v) => sum + (v.CantidadTotalProductos || 0), 0);
  const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Ventas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Historial de tus ventas personales - {user?.Nombre} {user?.Apellido}
        </p>
      </div>

      {/* Estadísticas Personales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Mis Ventas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVentas}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(montoTotal)}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProductos}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(promedioVenta)}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, método de pago o comentario..."
              />
            </div>
            <div>
              <select
                value={metodoPagoFiltro}
                onChange={(e) => setMetodoPagoFiltro(e.target.value)}
                className="input-field"
              >
                <option value="Todos">Todos los métodos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              Total: <span className="font-semibold ml-1">{filteredVentas.length}</span> ventas
            </div>
          </div>

          <div className="flex items-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input-field"
              />
            </div>
            <Button onClick={handleFiltrarPorFechas} icon={<Calendar className="w-5 h-5" />}>
              Filtrar
            </Button>
            <Button variant="secondary" onClick={fetchVentas}>
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Ventas */}
      <Card>
        <Table data={filteredVentas} columns={columns} emptyMessage="No tienes ventas registradas" />
      </Card>

      {/* Modal Detalle */}
      <Modal
        isOpen={detalleModalOpen}
        onClose={() => setDetalleModalOpen(false)}
        title={`Detalle de Venta #${ventaSeleccionada?.IdVenta}`}
        size="lg"
      >
        {ventaSeleccionada && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fecha</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(ventaSeleccionada.FechaVenta!)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cajero</p>
                <p className="font-medium text-gray-900 dark:text-white">{user?.Nombre} {user?.Apellido}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Método de Pago</p>
                <p className="font-medium text-gray-900 dark:text-white">{ventaSeleccionada.MetodoPago}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                <Badge variant={ventaSeleccionada.Estado ? 'success' : 'danger'}>
                  {ventaSeleccionada.Estado ? 'Activo' : 'Anulado'}
                </Badge>
              </div>
            </div>

            {ventaSeleccionada.Comentario && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Comentario</p>
                <p className="font-medium text-gray-900 dark:text-white">{ventaSeleccionada.Comentario}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Productos Vendidos</h3>
              <div className="space-y-2">
                {detalleVenta.map((detalle, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{detalle.Producto?.Nombre}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {detalle.Cantidad} x {formatCurrency(detalle.PrecioUnitario)}
                      </p>
                    </div>
                    <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(detalle.Subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-xl font-bold text-primary-600 dark:text-primary-400">
                <span>Total:</span>
                <span>{formatCurrency(ventaSeleccionada.Total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}