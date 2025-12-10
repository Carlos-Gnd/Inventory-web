// frontend/src/pages/Reportes.tsx
import { useState, useEffect } from 'react';
import { reporteService } from '../services/reporteService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FileSpreadsheet, FileText, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

export default function Reportes() {
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - 1);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [estadisticas, setEstadisticas] = useState<any>(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const ventasData = await reporteService.obtenerReporteVentas(
        new Date(fechaInicio).toISOString(),
        new Date(fechaFin).toISOString()
      );
      setEstadisticas(ventasData.estadisticas);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleExportarExcel = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona un rango de fechas');
      return;
    }

    setLoading(true);
    try {
      await reporteService.exportarVentasExcel(
        new Date(fechaInicio).toISOString(),
        new Date(fechaFin).toISOString()
      );
      toast.success('Reporte Excel descargado exitosamente');
    } catch (error: any) {
      toast.error('Error al generar reporte Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona un rango de fechas');
      return;
    }

    setLoading(true);
    try {
      await reporteService.exportarVentasPDF(
        new Date(fechaInicio).toISOString(),
        new Date(fechaFin).toISOString()
      );
      toast.success('Reporte PDF descargado exitosamente');
    } catch (error: any) {
      toast.error('Error al generar reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Genera y descarga reportes de ventas</p>
      </div>

      {/* Estadísticas rápidas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-600">
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {estadisticas.totalVentas}
              </p>
            </div>
          </Card>
          <Card className="border-l-4 border-l-green-600">
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(estadisticas.montoTotal)}
              </p>
            </div>
          </Card>
          <Card className="border-l-4 border-l-purple-600">
            <div>
              <p className="text-sm text-gray-600">Productos Vendidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {estadisticas.totalProductos}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Selección de fechas */}
      <Card title="Generar Reporte de Ventas">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={cargarEstadisticas}
              variant="secondary"
              icon={<Calendar className="w-5 h-5" />}
            >
              Actualizar Estadísticas
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Exportar Reporte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Excel */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Excel</h4>
                    <p className="text-sm text-gray-600">Formato .xlsx</p>
                  </div>
                </div>
                <Button
                  onClick={handleExportarExcel}
                  loading={loading}
                  className="w-full"
                  icon={<Download className="w-5 h-5" />}
                >
                  Descargar Excel
                </Button>
              </div>

              {/* PDF */}
              <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-600 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">PDF</h4>
                    <p className="text-sm text-gray-600">Formato .pdf</p>
                  </div>
                </div>
                <Button
                  onClick={handleExportarPDF}
                  loading={loading}
                  variant="danger"
                  className="w-full"
                  icon={<Download className="w-5 h-5" />}
                >
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Los reportes incluyen información detallada de todas las ventas en el período seleccionado.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}