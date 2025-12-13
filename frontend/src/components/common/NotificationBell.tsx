// frontend/src/components/common/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Trash2, AlertTriangle, Package, ShoppingCart, Info } from 'lucide-react';
import { useNotificacionStore } from '../../store/notificacionStore';
import { formatDateTime } from '../../utils/formatters';
import Badge from './Badge';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    notificaciones, 
    noLeidas, 
    loading,
    marcarLeida, 
    marcarTodasLeidas,
    eliminar,
    iniciarPolling,
    detenerPolling
  } = useNotificacionStore();

  // Iniciar polling al montar el componente
  useEffect(() => {
    iniciarPolling();
    return () => detenerPolling();
  }, [iniciarPolling, detenerPolling]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener icono según tipo
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

  // Obtener color según prioridad
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

  const handleMarcarLeida = async (e: React.MouseEvent, idNotificacion: number) => {
    e.stopPropagation();
    await marcarLeida(idNotificacion);
  };

  const handleEliminar = async (e: React.MouseEvent, idNotificacion: number) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta notificación?')) {
      await eliminar(idNotificacion);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${noLeidas > 0 ? 'animate-pulse' : ''}`} />
        
        {/* Badge con contador */}
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {noLeidas} sin leer
              </p>
            </div>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="overflow-y-auto max-h-[500px]">
            {loading && notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin mx-auto mb-2 w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
                Cargando...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map((notif) => (
                <div
                  key={notif.IdNotificacion}
                  className={`border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notif.Leida ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className={`p-2 rounded-lg ${getColorClasses(notif.Color)}`}>
                      {getIcon(notif.Icono)}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                          {notif.Titulo}
                        </h4>
                        <Badge variant={
                          notif.Prioridad === 'critica' ? 'danger' :
                          notif.Prioridad === 'alta' ? 'warning' :
                          notif.Prioridad === 'media' ? 'info' : 'default'
                        }>
                          {notif.Prioridad}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notif.Mensaje}
                      </p>

                      {/* Info del producto si existe */}
                      {notif.Producto && (
                        <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                          <span className="font-medium">{notif.Producto.Nombre}</span>
                          {' • '}
                          <span className="text-red-600 dark:text-red-400">
                            Stock: {notif.Producto.Stock}
                          </span>
                          {' / '}
                          <span className="text-gray-500 dark:text-gray-400">
                            Mín: {notif.Producto.StockMinimo}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(notif.FechaCreacion!)}
                        </span>

                        {/* Acciones */}
                        <div className="flex items-center gap-1">
                          {!notif.Leida && (
                            <button
                              onClick={(e) => handleMarcarLeida(e, notif.IdNotificacion!)}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400"
                              title="Marcar como leída"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleEliminar(e, notif.IdNotificacion!)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer (opcional) */}
          {notificaciones.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 p-3 text-center border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Aquí podrías navegar a una página de historial completo
                }}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}