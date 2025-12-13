// frontend/src/components/features/notificaciones/NotificacionFiltros.tsx
import { X, Filter } from 'lucide-react';
import Button from '../../common/Button';
import SearchBar from '../../common/SearchBar';

export type FiltroLeida = 'todas' | 'leidas' | 'no_leidas';
export type FiltroPrioridad = 'todas' | 'critica' | 'alta' | 'media' | 'baja';
export type FiltroTipo = 'todos' | 'stock_bajo' | 'stock_critico' | 'venta' | 'sistema';

interface NotificacionFiltrosProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filtroLeida: FiltroLeida;
  onFiltroLeidaChange: (value: FiltroLeida) => void;
  filtroPrioridad: FiltroPrioridad;
  onFiltroPrioridadChange: (value: FiltroPrioridad) => void;
  filtroTipo: FiltroTipo;
  onFiltroTipoChange: (value: FiltroTipo) => void;
  filtroFechaInicio: string;
  onFiltroFechaInicioChange: (value: string) => void;
  filtroFechaFin: string;
  onFiltroFechaFinChange: (value: string) => void;
  onLimpiar: () => void;
  resultadosCount?: number;
  totalCount?: number;
}

export default function NotificacionFiltros({
  searchTerm,
  onSearchChange,
  filtroLeida,
  onFiltroLeidaChange,
  filtroPrioridad,
  onFiltroPrioridadChange,
  filtroTipo,
  onFiltroTipoChange,
  filtroFechaInicio,
  onFiltroFechaInicioChange,
  filtroFechaFin,
  onFiltroFechaFinChange,
  onLimpiar,
  resultadosCount,
  totalCount
}: NotificacionFiltrosProps) {
  const hayFiltrosActivos = 
    searchTerm || 
    filtroLeida !== 'todas' || 
    filtroPrioridad !== 'todas' || 
    filtroTipo !== 'todos' || 
    filtroFechaInicio || 
    filtroFechaFin;

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por título, mensaje o producto..."
          />
        </div>
        {hayFiltrosActivos && (
          <Button
            variant="secondary"
            onClick={onLimpiar}
            icon={<X className="w-5 h-5" />}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Filtros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Estado */}
        <select
          value={filtroLeida}
          onChange={(e) => onFiltroLeidaChange(e.target.value as FiltroLeida)}
          className="input-field"
        >
          <option value="todas">📋 Todas</option>
          <option value="no_leidas">🔔 No Leídas</option>
          <option value="leidas">✅ Leídas</option>
        </select>

        {/* Prioridad */}
        <select
          value={filtroPrioridad}
          onChange={(e) => onFiltroPrioridadChange(e.target.value as FiltroPrioridad)}
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
          onChange={(e) => onFiltroTipoChange(e.target.value as FiltroTipo)}
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
          onChange={(e) => onFiltroFechaInicioChange(e.target.value)}
          className="input-field"
          placeholder="Desde"
        />

        {/* Fecha Fin */}
        <input
          type="date"
          value={filtroFechaFin}
          onChange={(e) => onFiltroFechaFinChange(e.target.value)}
          className="input-field"
          placeholder="Hasta"
        />
      </div>

      {/* Indicador de resultados */}
      {hayFiltrosActivos && resultadosCount !== undefined && totalCount !== undefined && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span>
            Mostrando <strong className="text-gray-900 dark:text-white">{resultadosCount}</strong> de{' '}
            <strong className="text-gray-900 dark:text-white">{totalCount}</strong> notificaciones
          </span>
        </div>
      )}
    </div>
  );
}