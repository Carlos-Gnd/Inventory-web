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
      // Obtener estadísticas de ventas (último mes)
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);

      const ventasData = await reporteService.obtenerReporteVentas(
        fechaInicio.toISOString(),
        fechaFin.toISOString()
      );

      // Obtener estadísticas de productos
      const productosData = await reporteService.obtenerReporteProductos();

      // Obtener productos con stock bajo
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
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Bienvenido, {user?.Nombre}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Resumen de tu inventario y ventas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas del mes */}
        <Card className="border-l-4 border-l-primary-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats?.totalVentas || 0)}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(stats?.totalProductos || 0)} productos vendidos
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        {/* Ingresos */}
        <Card className="border-l-4 border-l-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.montoTotal || 0)}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Promedio: {formatCurrency(stats?.promedioVenta || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Productos Activos */}
        <Card className="border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos Activos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats?.productosActivos || 0)}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Valor: {formatCurrency(stats?.valorInventario || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Stock Bajo */}
        <Card className="border-l-4 border-l-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(stats?.productosStockBajo || 0)}
              </h3>
              <p className="text-sm text-red-600 mt-1 font-medium">
                Requieren atención
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
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
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{producto.Nombre}</h4>
                  <p className="text-sm text-gray-600">
                    Categoría: {producto.Categoria?.Nombre || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock Actual</p>
                  <p className="text-2xl font-bold text-red-600">
                    {producto.Stock}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mínimo: {producto.StockMinimo}
                  </p>
                </div>
              </div>
            ))}
            {productosStockBajo.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
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
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-200 hover:shadow-md transition-all group"
          >
            <div className="p-2 bg-primary-600 rounded-lg group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Registrar Venta</h4>
              <p className="text-xs text-gray-600">Punto de venta</p>
            </div>
          </a>

          {isAdmin && (
            <>
              <a
                href="/productos"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Productos</h4>
                  <p className="text-xs text-gray-600">Gestionar inventario</p>
                </div>
              </a>

              <a
                href="/reportes"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Reportes</h4>
                  <p className="text-xs text-gray-600">Exportar datos</p>
                </div>
              </a>
            </>
          )}
        </div>
      </Card>

      {/* Info del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-5 h-5" />
            <div>
              <p className="text-sm">Última actualización</p>
              <p className="font-medium text-gray-900">
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
          <div className="flex items-center gap-3 text-gray-600">
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