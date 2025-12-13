// frontend/src/pages/Notificaciones.tsx
import { useState, useEffect } from 'react';
import { notificacionService } from '../services/notificacionService';
import { Notificacion, EstadisticasNotificaciones } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import {
  Bell, Check, CheckCheck, Trash2, Filter, X, 
  AlertTriangle, Package, ShoppingCart, Info,
  Calendar, TrendingUp, AlertCircle
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

type FiltroLeida = 'todas' | 'leidas' | 'no_leidas';
type FiltroPrioridad = 'todas' | 'critica' | 'alta' | 'media' | 'baja';
type FiltroTipo = 'todos' | 'stock_bajo' | 'stock_critico' | 'venta' | 'sistema';

export default function Notificaciones() {
  const { user } = useAuthStore();
  const isAdmin = user?.IdRol === 1;

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filteredNotificaciones, setFilteredNotificaciones] = useState<Notificacion[]>([]);
  const [stats, setStats] = useState<EstadisticasNotificaciones | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLeida, setFiltroLeida] = useState<FiltroLeida>('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>('todas');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterNotificaciones();
  }, [debouncedSearch, notificaciones, filtroLeida, filtroPrioridad, filtroTipo, filtroFechaInicio, filtroFechaFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifData, statsData] = await Promise.all([
        notificacionService.listar({ limite: 200 }),
        notificacionService.obtenerEstadisticas()
      ]);
      
      setNotificaciones(notifData);
      setFilteredNotificaciones(notifData);
      setStats(statsData);
    } catch (error) {
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const filterNotificaciones = () => {
    let filtered = [...notificaciones];

    // Filtro por búsqueda
    if (debouncedSearch) {
      filtered = filtered.filter(n =>
        n.Titulo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        n.Mensaje.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        n.Producto?.Nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Filtro por estado leído
    if (filtroLeida === 'leidas') {
      filtered = filtered.filter(n => n.Leida);
    } else if (filtroLeida === 'no_leidas') {
      filtered = filtered.filter(n => !n.Leida);
    }

    // Filtro por prioridad
    if (filtroPrioridad !== 'todas') {
      filtered = filtered.filter(n => n.Prioridad === filtroPrioridad);
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtered = filtered.filter(n => n.Tipo === filtroTipo);
    }

    // Filtro por rango de fechas
    if (filtroFechaInicio) {
      const inicio = new Date(filtroFechaInicio);
      filtered = filtered.filter(n => new Date(n.FechaCreacion!) >= inicio);
    }
    if (filtroFechaFin) {
      const fin = new Date(filtroFechaFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(n => new Date(n.FechaCreacion!) <= fin);
    }

    setFilteredNotificaciones(filtered);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroLeida('todas');
    setFiltroPrioridad('todas');
    setFiltroTipo('todos');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  const handleMarcarLeida = async (idNotificacion: number) => {
    try {
      await notificacionService.marcarLeida(idNotificacion);
      setNotificaciones(prev =>
        prev.map(n =>
          n.IdNotificacion === idNotificacion ? { ...n, Leida: true } : n
        )
      );
      toast.success('Notificación marcada como leída');
      await fetchData(); // Actualizar stats
    } catch (error) {
      toast.error('Error al marcar notificación');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      const count = await notificacionService.marcarTodasLeidas();
      await fetchData();
      toast.success(`${count} notificaciones marcadas como leídas`);
    } catch (error) {
      toast.error('Error al marcar notificaciones');
    }
  };

  const handleEliminar = async (idNotificacion: number) => {
    if (!window.confirm('¿Eliminar esta notificación?')) return;

    try {
      await notificacionService.eliminar(idNotificacion);
      setNotificaciones(prev => prev.filter(n => n.IdNotificacion !== idNotificacion));
      await fetchData(); // Actualizar stats
      toast.success('Notificación eliminada');
    } catch (error) {
      toast.error('Error al eliminar notificación');
    }
  };

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'alert-triangle': <AlertTriangle className="w-5 h-5" />,
      'package-x': <Package className="w-5 h-5" />,
      'shopping-cart': <ShoppingCart className="w-5 h-5" />,
      'info': <Info className="w-5 h-5" />,
      'bell': <Bell className="w-5 h-5" />
    };
    return iconMap[iconName || 'bell'] || <Bell className="w-5 h-5" />;
  };

  const getColorClasses = (color?: string) => {
    const colorMap: Record<string, string> = {
      'red': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      'orange': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      'yellow': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      'blue': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'green': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    };
    return colorMap[color || 'blue'] || colorMap['blue'];
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Centro de notificaciones del sistema</p>
        </div>
        {isAdmin && (
          <Button
            variant="secondary"
            onClick={handleMarcarTodasLeidas}
            icon={<CheckCheck className="w-5 h-5" />}
            disabled={!stats || stats.NoLeidas === 0}
          >
            Marcar Todas Leídas
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.TotalNotificaciones}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">No Leídas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.NoLeidas}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-red-500 dark:border-l-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Críticas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.Criticas}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Alta Prioridad</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.Altas}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, mensaje o producto..."
              />
            </div>
            <Button
              variant="secondary"
              onClick={limpiarFiltros}
              icon={<X className="w-5 h-5" />}
            >
              Limpiar
            </Button>
          </div>

          {/* Filtros avanzados */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Estado */}
            <select
              value={filtroLeida}
              onChange={(e) => setFiltroLeida(e.target.value as FiltroLeida)}
              className="input-field"
            >
              <option value="todas">📋 Todas</option>
              <option value="no_leidas">🔔 No Leídas</option>
              <option value="leidas">✅ Leídas</option>
            </select>

            {/* Prioridad */}
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value as FiltroPrioridad)}
              className="input-field"
            >
              <option value="todas">🎯 Todas las Prioridades</option>
              <option value="critica">🚨 Crítica</option>
              <option value="alta">⚠️ Alta</option>
              <option value="media">ℹ️ Media</option>
              <option value="baja">📌 Baja</option>
            </select>

            {/* Tipo */}
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
              className="input-field"
            >
              <option value="todos">📦 Todos los Tipos</option>
              <option value="stock_bajo">⚡ Stock Bajo</option>
              <option value="stock_critico">🚨 Stock Crítico</option>
              <option value="venta">🛒 Venta</option>
              <option value="sistema">⚙️ Sistema</option>
            </select>

            {/* Fecha Inicio */}
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="input-field"
              placeholder="Desde"
            />

            {/* Fecha Fin */}
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="input-field"
              placeholder="Hasta"
            />
          </div>

          {/* Indicador de filtros activos */}
          {(searchTerm || filtroLeida !== 'todas' || filtroPrioridad !== 'todas' || 
            filtroTipo !== 'todos' || filtroFechaInicio || filtroFechaFin) && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>
                Mostrando <strong>{filteredNotificaciones.length}</strong> de{' '}
                <strong>{notificaciones.length}</strong> notificaciones
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Notificaciones */}
      <Card>
        {filteredNotificaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay notificaciones</p>
            <p className="text-sm mt-2">
              {searchTerm || filtroLeida !== 'todas' || filtroPrioridad !== 'todas'
                ? 'Prueba con otros filtros'
                : 'Las notificaciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotificaciones.map((notif) => (
              <div
                key={notif.IdNotificacion}
                className={`p-4 rounded-lg border transition-all ${
                  !notif.Leida
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                } hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  <div className={`p-3 rounded-lg ${getColorClasses(notif.Color)}`}>
                    {getIcon(notif.Icono)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{notif.Titulo}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            notif.Prioridad === 'critica' ? 'danger' :
                            notif.Prioridad === 'alta' ? 'warning' :
                            notif.Prioridad === 'media' ? 'info' : 'default'
                          }
                        >
                          {notif.Prioridad}
                        </Badge>
                        {!notif.Leida && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" title="No leída" />
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notif.Mensaje}</p>

                    {/* Info del producto */}
                    {notif.Producto && (
                      <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                        <strong className="text-gray-900 dark:text-white">{notif.Producto.Nombre}</strong>
                        {' • '}
                        <span className="text-red-600 dark:text-red-400">Stock: {notif.Producto.Stock}</span>
                        {' / '}
                        <span className="text-gray-600 dark:text-gray-400">Mín: {notif.Producto.StockMinimo}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(notif.FechaCreacion!)}
                        </span>
                        <Badge variant="default">{notif.Tipo}</Badge>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        {!notif.Leida && (
                          <button
                            onClick={() => handleMarcarLeida(notif.IdNotificacion!)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleEliminar(notif.IdNotificacion!)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}