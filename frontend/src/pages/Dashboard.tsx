// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reporteService } from '../services/reporteService';
import { productoService } from '../services/productoService';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import toast from 'react-hot-toast';

interface Stats {
  totalVentas: number;
  montoTotal: number;
  totalProductos: number;
  promedioVenta: number;
  productosActivos: number;
  productosStockBajo: number;
  valorInventario: number;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [productosStockBajo, setProductosStockBajo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);

      const ventasData = await reporteService.obtenerReporteVentas(
        fechaInicio.toISOString(),
        fechaFin.toISOString()
      );

      const productosData = await reporteService.obtenerReporteProductos();
      const stockBajo = await productoService.obtenerStockBajo();

      setStats({
        totalVentas: ventasData.estadisticas.totalVentas,
        montoTotal: ventasData.estadisticas.montoTotal,
        totalProductos: ventasData.estadisticas.totalProductos,
        promedioVenta: ventasData.estadisticas.promedioVenta,
        productosActivos: productosData.estadisticas.productosActivos,
        productosStockBajo: productosData.estadisticas.productosStockBajo,
        valorInventario: productosData.estadisticas.valorInventario
      });

      setProductosStockBajo(stockBajo);
    } catch (error: any) {
      console.error('Error al cargar dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ¡Bienvenido, {user?.Nombre}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Resumen de tu inventario y ventas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del mes */}
        <Card className="border-l-4 border-l-primary-600 dark:border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ventas del Mes</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatNumber(stats?.totalVentas || 0)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatNumber(stats?.totalProductos || 0)} productos vendidos
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        {/* Ingresos */}
        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats?.montoTotal || 0)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Promedio: {formatCurrency(stats?.promedioVenta || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Productos Activos */}
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Productos Activos</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatNumber(stats?.productosActivos || 0)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Valor: {formatCurrency(stats?.valorInventario || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Stock Bajo */}
        <Card className="border-l-4 border-l-red-500 dark:border-l-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Stock Bajo</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatNumber(stats?.productosStockBajo || 0)}
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-medium">
                Requieren atención
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Productos con Stock Bajo */}
      {productosStockBajo.length > 0 && (
        <Card
          title="⚠️ Productos con Stock Bajo"
          subtitle="Estos productos necesitan ser reabastecidos"
        >
          <div className="space-y-3">
            {productosStockBajo.slice(0, 5).map((producto) => (
              <div
                key={producto.IdProducto}
                className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{producto.Nombre}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Categoría: {producto.Categoria?.Nombre || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stock Actual</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {producto.Stock}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mínimo: {producto.StockMinimo}
                  </p>
                </div>
              </div>
            ))}
            {productosStockBajo.length > 5 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                Y {productosStockBajo.length - 5} productos más con stock bajo
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Accesos Rápidos */}
      <Card title="⚡ Accesos Rápidos">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/registrar-ventas"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg border border-primary-200 dark:border-primary-800 hover:shadow-md transition-all group"
          >
            <div className="p-2 bg-primary-600 rounded-lg group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Registrar Venta</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Punto de venta</p>
            </div>
          </a>

          {isAdmin && (
            <>
              <a
                href="/productos"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Productos</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Gestionar inventario</p>
                </div>
              </a>

              <a
                href="/reportes"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Reportes</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Exportar datos</p>
                </div>
              </a>
            </>
          )}
        </div>
      </Card>

      {/* Info del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Calendar className="w-5 h-5" />
            <div>
              <p className="text-sm">Última actualización</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('es-SV', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Users className="w-5 h-5" />
            <div>
              <p className="text-sm">Tu rol</p>
              <Badge variant={isAdmin ? 'info' : 'success'}>
                {isAdmin ? 'Administrador' : 'Cajero'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}