import api from './api';
import { EstadisticasVentas, EstadisticasProductos } from '../types';

export const reporteService = {
  obtenerReporteVentas: async (fechaInicio: string, fechaFin: string) => {
    const { data } = await api.get('/reportes/ventas', {
      params: { fechaInicio, fechaFin }
    });
    return data;
  },

  obtenerReporteProductos: async () => {
    const { data } = await api.get('/reportes/productos');
    return data;
  },

  exportarVentasExcel: async (fechaInicio: string, fechaFin: string) => {
    const response = await api.post('/reportes/ventas/excel', 
      { fechaInicio, fechaFin },
      { responseType: 'blob' }
    );
    
    // Descargar archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Ventas_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportarVentasPDF: async (fechaInicio: string, fechaFin: string) => {
    const response = await api.post('/reportes/ventas/pdf', 
      { fechaInicio, fechaFin },
      { responseType: 'blob' }
    );
    
    // Descargar archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Ventas_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};