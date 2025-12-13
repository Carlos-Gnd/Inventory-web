// frontend/src/components/features/notificaciones/NotificacionesWidget.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacionService } from '../../../services/notificacionService';
import { Notificacion } from '../../../types';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import Button from '../../common/Button';
import { Bell, AlertTriangle, Package, ArrowRight, Eye } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatters';

export default function NotificacionesWidget() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const data = await notificacionService.listar({ 
        leida: false, 
        limite: 5 
      });
      setNotificaciones(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName?: string) => {
    if (iconName === 'alert-triangle') return <AlertTriangle className="w-4 h-4" />;
    if (iconName === 'package-x') return <Package className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const getColorClasses = (color?: string) => {
    const colorMap: Record<string, string> = {
      'red': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      'orange': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      'blue': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    };
    return colorMap[color || 'blue'] || colorMap['blue'];
  };

  if (loading) {
    return (
      <Card title="🔔 Notificaciones Recientes">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="🔔 Notificaciones Recientes"
      subtitle={notificaciones.length > 0 ? `${notificaciones.length} sin leer` : undefined}
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/notificaciones')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Ver Todas
        </Button>
      }
    >
      {notificaciones.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay notificaciones nuevas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((notif) => (
            <div
              key={notif.IdNotificacion}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
              onClick={() => navigate('/notificaciones')}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded ${getColorClasses(notif.Color)}`}>
                  {getIcon(notif.Icono)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {notif.Titulo}
                    </h4>
                    <Badge 
                      variant={
                        notif.Prioridad === 'critica' ? 'danger' :
                        notif.Prioridad === 'alta' ? 'warning' : 'info'
                      }
                    >
                      {notif.Prioridad}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                    {notif.Mensaje}
                  </p>
                  {notif.Producto && (
                    <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 rounded px-2 py-1 mb-1">
                      <span className="font-medium">{notif.Producto.Nombre}</span>
                      {' • '}
                      <span className="text-red-600 dark:text-red-400">
                        Stock: {notif.Producto.Stock}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(notif.FechaCreacion!)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}