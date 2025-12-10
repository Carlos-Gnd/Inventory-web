// frontend/src/pages/HistorialSesiones.tsx
import { useState, useEffect } from 'react';
import { historialSesionService } from '../services/historialSesionService';
import { HistorialSesion, EstadisticasSesiones } from '../types';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchBar from '../components/common/SearchBar';
import { Shield, Activity, AlertCircle, Check, X } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

export default function HistorialSesiones() {
  const [sesiones, setSesiones] = useState<HistorialSesion[]>([]);
  const [filteredSesiones, setFilteredSesiones] = useState<HistorialSesion[]>([]);
  const [stats, setStats] = useState<EstadisticasSesiones | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSesiones();
  }, [debouncedSearch, sesiones]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sesionesData, statsData] = await Promise.all([
        historialSesionService.listar(200),
        historialSesionService.obtenerEstadisticas()
      ]);
      setSesiones(sesionesData);
      setFilteredSesiones(sesionesData);
      setStats(statsData);
    } catch (error) {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const filterSesiones = () => {
    if (!debouncedSearch) {
      setFilteredSesiones(sesiones);
      return;
    }

    const filtered = sesiones.filter(s =>
      s.Usuario?.Nombre?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.DireccionIP.includes(debouncedSearch) ||
      s.Navegador.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.Dispositivo.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    setFilteredSesiones(filtered);
  };

  const columns = [
    {
      key: 'FechaHora',
      header: 'Fecha y Hora',
      render: (s: HistorialSesion) => formatDateTime(s.FechaHora!)
    },
    {
      key: 'Usuario',
      header: 'Usuario',
      render: (s: HistorialSesion) => s.Usuario?.Nombre || 'N/A'
    },
    {
      key: 'DireccionIP',
      header: 'IP',
      render: (s: HistorialSesion) => (
        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {s.DireccionIP}
        </code>
      )
    },
    {
      key: 'Navegador',
      header: 'Navegador'
    },
    {
      key: 'Dispositivo',
      header: 'Dispositivo'
    },
    {
      key: 'SistemaOperativo',
      header: 'S.O.',
      width: '100px'
    },
    {
      key: 'Exitoso',
      header: 'Estado',
      width: '120px',
      render: (s: HistorialSesion) => (
        <Badge variant={s.Exitoso ? 'success' : 'danger'}>
          {s.Exitoso ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" /> Exitoso
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <X className="w-3 h-3" /> Fallido
            </span>
          )}
        </Badge>
      )
    },
    {
      key: 'MotivoFallo',
      header: 'Detalle',
      render: (s: HistorialSesion) => 
        s.MotivoFallo ? (
          <span className="text-sm text-red-600 dark:text-red-400">{s.MotivoFallo}</span>
        ) : '-'
    }
  ];

  if (loading) return <LoadingSpinner size="lg" />;

  const tasaExito = stats ? ((stats.SesionesExitosas / stats.TotalSesiones) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historial de Sesiones</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Auditoría y seguridad de accesos</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-600 dark:border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sesiones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.TotalSesiones || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-600 dark:border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exitosas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.SesionesExitosas || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {tasaExito}% tasa éxito
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-red- dark:border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fallidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.SesionesFallidas || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-600 dark:border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">IPs Únicas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.IPsUnicas || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, IP, navegador..."
            className="w-full max-w-md"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando: <span className="font-semibold">{filteredSesiones.length}</span> de{' '}
            <span className="font-semibold">{sesiones.length}</span>
          </div>
        </div>
        <Table 
          data={filteredSesiones} 
          columns={columns} 
          emptyMessage="No hay registros de sesiones"
        />
      </Card>
    </div>
  );
}