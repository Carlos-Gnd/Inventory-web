// frontend/src/pages/Ventas.tsx
import { useState, useEffect } from 'react';
import { ventaService } from '../services/ventaService';
import { Venta, DetalleVenta } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { Eye, Calendar, Receipt} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const data = await ventaService.listar();
      setVentas(data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
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
      setVentas(data);
      toast.success(`${data.length} ventas encontradas`);
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
      key: 'Usuario',
      header: 'Cajero',
      render: (v: Venta) => v.Usuario?.Nombre || 'N/A'
    },
    {
      key: 'Total',
      header: 'Total',
      render: (v: Venta) => formatCurrency(v.Total)
    },
    { key: 'MetodoPago', header: 'Método de Pago' },
    {
      key: 'CantidadTotalProductos',
      header: 'Productos',
      render: (v: Venta) => v.CantidadTotalProductos || 0
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
      width: '120px', // Aumenta un poco el ancho
      render: (venta: Venta) => (
        <div className="flex gap-2">
          {/* Botón Ver Detalle (Existente) */}
          <button
            onClick={(e) => {
            e.stopPropagation();
            handleVerDetalle(venta);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Ver Detalle"
            >
            <Eye className="w-4 h-4" />
          </button>

          {/* Botón Imprimir */}
          <button
            onClick={(e) => {
            e.stopPropagation();
            ventaService.imprimirTicket(venta.IdVenta!);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Imprimir Ticket"
            >
            <Receipt className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Calcular totales
  const totalVentas = ventas.filter(v => v.Estado).length;
  const montoTotal = ventas.filter(v => v.Estado).reduce((sum, v) => sum + v.Total, 0);
  const totalProductos = ventas.filter(v => v.Estado).reduce((sum, v) => sum + (v.CantidadTotalProductos || 0), 0);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ventas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Historial completo de ventas</p>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVentas}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(montoTotal)}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Productos Vendidos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProductos}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex items-end gap-4">
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
      </Card>

      {/* Tabla de Ventas */}
      <Card>
        <Table data={ventas} columns={columns} emptyMessage="No hay ventas registradas" />
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
                <p className="font-medium text-gray-900 dark:text-white">{ventaSeleccionada.Usuario?.Nombre}</p>
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
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Productos</h3>
              <div className="space-y-2">
                {detalleVenta.map((detalle, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{detalle.Producto?.Nombre}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {detalle.Cantidad} x {formatCurrency(detalle.PrecioUnitario)}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(detalle.Subtotal)}</p>
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