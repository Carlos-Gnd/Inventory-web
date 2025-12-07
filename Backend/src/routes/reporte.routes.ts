import { Router } from 'express';
import { VentaRepository } from '../repositories/venta.repository';
import { ProductoRepository } from '../repositories/producto.repository';
import { authMiddleware } from '../middleware/auth.middleware';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();
const ventaRepo = new VentaRepository();
const productoRepo = new ProductoRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener datos para reporte de ventas
router.get('/ventas', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    const inicio = new Date(fechaInicio as string);
    const fin = new Date(fechaFin as string);

    const ventas = await ventaRepo.listarPorFechas(inicio, fin);
    
    // Calcular totales
    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((sum, venta) => sum + Number(venta.Total), 0);
    const totalProductos = ventas.reduce((sum, venta) => sum + (venta.CantidadTotalProductos || 0), 0);

    res.json({
      ventas,
      estadisticas: {
        totalVentas,
        montoTotal,
        totalProductos,
        promedioVenta: totalVentas > 0 ? montoTotal / totalVentas : 0
      }
    });
  } catch (error: any) {
    console.error('Error al obtener reporte de ventas:', error);
    res.status(500).json({ error: 'Error al obtener reporte de ventas' });
  }
});

// Obtener datos para reporte de productos
router.get('/productos', async (req, res) => {
  try {
    const productos = await productoRepo.listar();
    
    // Estadísticas
    const totalProductos = productos.length;
    const productosActivos = productos.filter(p => p.Estado).length;
    const productosStockBajo = productos.filter(p => p.Stock <= p.StockMinimo && p.Estado).length;
    const valorInventario = productos
      .filter(p => p.Estado)
      .reduce((sum, p) => sum + (Number(p.Precio) * p.Stock), 0);

    res.json({
      productos,
      estadisticas: {
        totalProductos,
        productosActivos,
        productosStockBajo,
        valorInventario
      }
    });
  } catch (error: any) {
    console.error('Error al obtener reporte de productos:', error);
    res.status(500).json({ error: 'Error al obtener reporte de productos' });
  }
});

// Generar reporte de ventas en Excel
router.post('/ventas/excel', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const ventas = await ventaRepo.listarPorFechas(inicio, fin);

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Ventas');

    // Título
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'REPORTE DE VENTAS';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Información
    worksheet.getCell('A2').value = `Período: ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`;
    worksheet.getCell('A3').value = `Fecha de generación: ${new Date().toLocaleString()}`;

    // Encabezados
    worksheet.getRow(5).values = ['ID Venta', 'Fecha', 'Cajero', 'Total', 'Método Pago', 'Estado'];
    worksheet.getRow(5).font = { bold: true };
    worksheet.getRow(5).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Datos
    let row = 6;
    let totalGeneral = 0;
    
    ventas.forEach(venta => {
      worksheet.getRow(row).values = [
        venta.IdVenta,
        venta.FechaVenta ? new Date(venta.FechaVenta).toLocaleString() : '',
        venta.Usuario?.Nombre || 'N/A',
        Number(venta.Total),
        venta.MetodoPago,
        venta.Estado ? 'Activo' : 'Anulado'
      ];
      
      // Formato moneda
      worksheet.getCell(`D${row}`).numFmt = '$#,##0.00';
      
      totalGeneral += Number(venta.Total);
      row++;
    });

    // Total
    worksheet.getCell(`C${row + 1}`).value = 'TOTAL:';
    worksheet.getCell(`C${row + 1}`).font = { bold: true };
    worksheet.getCell(`D${row + 1}`).value = totalGeneral;
    worksheet.getCell(`D${row + 1}`).numFmt = '$#,##0.00';
    worksheet.getCell(`D${row + 1}`).font = { bold: true };

    // Ajustar columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Enviar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Ventas_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ error: 'Error al generar reporte Excel' });
  }
});

// Generar reporte de ventas en PDF
router.post('/ventas/pdf', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const ventas = await ventaRepo.listarPorFechas(inicio, fin);

    // Crear PDF
    const doc = new PDFDocument({ margin: 50 });

    // Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Ventas_${Date.now()}.pdf`);

    doc.pipe(res);

    // Título
    doc.fontSize(20).text('REPORTE DE VENTAS', { align: 'center' });
    doc.moveDown();

    // Información
    doc.fontSize(10)
       .text(`Período: ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}`)
       .text(`Fecha de generación: ${new Date().toLocaleString()}`)
       .moveDown();

    // Tabla
    let y = doc.y;
    const tableTop = y + 10;
    const columnWidth = 90;

    // Headers
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('ID', 50, tableTop);
    doc.text('Fecha', 90, tableTop);
    doc.text('Cajero', 190, tableTop);
    doc.text('Total', 290, tableTop);
    doc.text('Método', 370, tableTop);
    doc.text('Estado', 470, tableTop);

    // Línea
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // Datos
    doc.font('Helvetica');
    y = tableTop + 20;
    let totalGeneral = 0;

    ventas.forEach(venta => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(venta.IdVenta?.toString() || '', 50, y);
      doc.text(venta.FechaVenta ? new Date(venta.FechaVenta).toLocaleDateString() : '', 90, y);
      doc.text(venta.Usuario?.Nombre || 'N/A', 190, y, { width: 90 });
      doc.text(`$${Number(venta.Total).toFixed(2)}`, 290, y);
      doc.text(venta.MetodoPago || '', 370, y);
      doc.text(venta.Estado ? 'Activo' : 'Anulado', 470, y);

      totalGeneral += Number(venta.Total);
      y += 20;
    });

    // Total
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`TOTAL: $${totalGeneral.toFixed(2)}`, 290, y + 10);

    doc.end();
  } catch (error: any) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error al generar reporte PDF' });
  }
});

export default router;