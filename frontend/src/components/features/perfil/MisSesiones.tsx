// frontend/src/components/features/perfil/MisSesiones.tsx
import { useState, useEffect } from 'react';
import { historialSesionService } from '../../../services/historialSesionService';
import { HistorialSesion } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import Card from '../../common/Card';
import Badge from '../../common/Badge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { Monitor, Smartphone, Tablet, Check, X, MapPin } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatters';
import toast from 'react-hot-toast';

export default function MisSesiones() {
  const { user } = useAuthStore();
  const [sesiones, setSesiones] = useState<HistorialSesion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSesiones();
  }, []);

  const fetchSesiones = async () => {
    if (!user?.IdUsuario) return;
    
    setLoading(true);
    try {
      const data = await historialSesionService.listarPorUsuario(user.IdUsuario, 20);
      setSesiones(data);
    } catch (error) {
      toast.error('Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (dispositivo: string) => {
    if (dispositivo === 'Mobile') return <Smartphone className="w-4 h-4" />;
    if (dispositivo === 'Tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Card title="Mis Últimas Sesiones" subtitle={`${sesiones.length} accesos recientes`}>
      <div className="space-y-3">
        {sesiones.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay registros de sesiones
          </p>
        ) : (
          sesiones.map((sesion) => (
            <div
              key={sesion.IdSesion}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Icono de dispositivo */}
                <div className={`p-2 rounded-lg ${
                  sesion.Exitoso 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {getDeviceIcon(sesion.Dispositivo)}
                </div>

                {/* Información */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sesion.Navegador} en {sesion.SistemaOperativo}
                    </span>
                    <Badge variant={sesion.Exitoso ? 'success' : 'danger'}>
                      {sesion.Exitoso ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Exitoso
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <X className="w-3 h-3" /> Fallido
                        </span>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {sesion.DireccionIP}
                    </span>
                    <span>{formatDateTime(sesion.FechaHora!)}</span>
                  </div>

                  {sesion.MotivoFallo && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      {sesion.MotivoFallo}
                    </p>
                  )}
                </div>
              </div>

              {/* Badge de dispositivo */}
              <Badge variant="default">
                {sesion.Dispositivo}
              </Badge>
            </div>
          ))
        )}
      </div>

      {sesiones.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Tip de seguridad:</strong> Si ves actividad sospechosa, cambia tu contraseña inmediatamente.
          </p>
        </div>
      )}
    </Card>
  );
}