// backend/src/services/ticketService.ts
import PDFDocument from 'pdfkit';
import { Venta, DetalleVenta } from '../models';

export const ticketService = {
  generarTicket: (venta: Venta, detalles: DetalleVenta[], res: any) => {
    // Configuración para papel térmico de 58mm (aprox 165 puntos de ancho)
    const doc = new PDFDocument({
      size: [165, 1000], // Ancho fijo 58mm, largo dinámico
      margins: { top: 10, bottom: 10, left: 5, right: 5 },
      autoFirstPage: false 
    });

    doc.pipe(res);
    doc.addPage();

    // --- ESTILOS ---
    const anchoUtil = 155;
    const fuenteNormal = 'Helvetica';
    const fuenteBold = 'Helvetica-Bold';

    // Helper para centrar texto
    const centrar = (texto: string, size: number = 7) => {
      doc.font(fuenteNormal).fontSize(size).text(texto, { align: 'center', width: anchoUtil });
    };

    // 1. ENCABEZADO
    doc.font(fuenteBold).fontSize(10)
       .text('SMART INVENTORY', { align: 'center', width: anchoUtil });
    
    doc.moveDown(0.2);
    centrar('Sucursal Principal');
    centrar('San Miguel, El Salvador');
    centrar('Tel: 7777-7777');
    doc.moveDown(0.5);

    // 2. DATOS DE LA VENTA
    centrar('--------------------------------');
    doc.font(fuenteNormal).fontSize(7);
    doc.text(`Ticket: #${venta.IdVenta}`);
    
    // Formatear fecha
    const fecha = venta.FechaVenta ? new Date(venta.FechaVenta) : new Date();
    doc.text(`Fecha: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`);
    doc.text(`Cajero: ${venta.Usuario?.Nombre || 'Cajero'}`);
    centrar('--------------------------------');
    doc.moveDown(0.5);

    // 3. DETALLE DE PRODUCTOS
    // Encabezados
    doc.font(fuenteBold).fontSize(6);
    const yHeader = doc.y;
    doc.text('CANT', 5, yHeader, { width: 20 });
    doc.text('PRODUCTO', 30, yHeader, { width: 85 });
    doc.text('TOTAL', 115, yHeader, { width: 40, align: 'right' });
    doc.moveDown(0.5);

    // Lista de Items
    doc.font(fuenteNormal);
    detalles.forEach(item => {
      const nombre = item.Producto?.Nombre || 'Producto';
      const subtotal = Number(item.Subtotal).toFixed(2);
      const yInicio = doc.y;

      // Columna Cantidad
      doc.text(item.Cantidad.toString(), 5, yInicio, { width: 20 });
      
      // Columna Nombre (multilínea si es largo)
      doc.text(nombre, 30, yInicio, { width: 85, align: 'left' });
      
      // Columna Total (alineado a la derecha)
      doc.text(`$${subtotal}`, 115, yInicio, { width: 40, align: 'right' });
      
      // Calcular nueva posición Y basada en la altura del nombre
      const alturaNombre = doc.heightOfString(nombre, { width: 85 });
      doc.y = yInicio + alturaNombre + 2; 
    });

    doc.moveDown(0.5);
    centrar('--------------------------------');

    // 4. TOTALES
    doc.font(fuenteBold).fontSize(8);
    const xLabel = 40;
    const xValue = 115;
    const wValue = 40;

    // Subtotal y Descuento (solo si aplica)
    if (venta.Descuento && Number(venta.Descuento) > 0) {
        doc.fontSize(7);
        doc.text('Subtotal:', xLabel, doc.y, { align: 'right', width: 70 });
        doc.moveUp();
        doc.text(`$${Number(venta.Subtotal).toFixed(2)}`, xValue, doc.y, { align: 'right', width: wValue });
        
        doc.text('Descuento:', xLabel, doc.y, { align: 'right', width: 70 });
        doc.moveUp();
        doc.text(`-$${Number(venta.Descuento).toFixed(2)}`, xValue, doc.y, { align: 'right', width: wValue });
        
        doc.moveDown(0.2);
    }

    // Total Final (Grande)
    doc.fontSize(10);
    doc.text('TOTAL:', xLabel, doc.y, { align: 'right', width: 70 });
    doc.moveUp();
    doc.text(`$${Number(venta.Total).toFixed(2)}`, xValue, doc.y, { align: 'right', width: wValue });
    
    // Método de Pago
    doc.fontSize(7).font(fuenteNormal);
    doc.moveDown(0.5);
    doc.text(`Pago: ${venta.MetodoPago}`, { align: 'right', width: anchoUtil });

    // 5. PIE DE PÁGINA
    doc.moveDown(2);
    centrar('¡Gracias por su compra!');
    centrar('No se aceptan devoluciones');
    centrar('después de 3 días.');
    
    // Código de venta
    doc.moveDown(1);
    doc.fontSize(8).font('Courier').text(`*${venta.IdVenta}*`, { align: 'center' });

    doc.end();
  }
};