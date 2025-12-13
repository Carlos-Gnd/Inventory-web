// Backend/src/workers/emailWorker.ts
import { pool } from '../config/database';
import { emailService } from '../services/emailService';
import { Notificacion } from '../models';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

class EmailWorker {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  // Iniciar worker (cada 1 minuto)
  start() {
    if (this.isRunning) {
      console.log('⚠️ Email worker ya está corriendo');
      return;
    }

    console.log('🚀 Iniciando Email Worker...');
    this.isRunning = true;

    // Ejecutar inmediatamente
    this.procesarEmailsPendientes();

    // Ejecutar cada 1 minuto
    this.intervalId = setInterval(() => {
      this.procesarEmailsPendientes();
    }, 60000); // 60 segundos
  }

  // Detener worker
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Email Worker detenido');
    }
  }

  // Procesar emails pendientes
  private async procesarEmailsPendientes() {
    try {
      // Obtener notificaciones que requieren email y no lo han enviado
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          n.IdNotificacion, n.Tipo, n.Titulo, n.Mensaje,
          n.IdProducto, n.Prioridad, n.Icono, n.Color,
          p.Nombre AS ProductoNombre,
          p.Stock AS ProductoStock,
          p.StockMinimo AS ProductoStockMinimo
        FROM Notificaciones n
        LEFT JOIN Productos p ON n.IdProducto = p.IdProducto
        WHERE n.EmailEnviado = FALSE
          AND n.Prioridad IN ('critica', 'alta')
          AND n.FechaCreacion > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY 
          FIELD(n.Prioridad, 'critica', 'alta'),
          n.FechaCreacion ASC
        LIMIT 10
      `);

      if (rows.length === 0) {
        return;
      }

      console.log(`📧 Procesando ${rows.length} notificaciones pendientes...`);

      for (const row of rows) {
        const notificacion: Notificacion = {
          IdNotificacion: row.IdNotificacion,
          Tipo: row.Tipo,
          Titulo: row.Titulo,
          Mensaje: row.Mensaje,
          IdProducto: row.IdProducto,
          Prioridad: row.Prioridad,
          Leida: false,
          Icono: row.Icono,
          Color: row.Color,
          Producto: row.ProductoNombre ? {
            Nombre: row.ProductoNombre,
            Stock: row.ProductoStock,
            StockMinimo: row.ProductoStockMinimo
          } : undefined
        };

        // Enviar email
        const enviado = await emailService.enviarNotificacion(notificacion);

        // Marcar como enviado
        if (enviado) {
          await pool.query<ResultSetHeader>(
            'UPDATE Notificaciones SET EmailEnviado = TRUE WHERE IdNotificacion = ?',
            [notificacion.IdNotificacion]
          );
        }

        // Delay de 1 segundo entre emails para evitar spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ ${rows.length} emails procesados`);
    } catch (error) {
      console.error('❌ Error al procesar emails:', error);
    }
  }

  // Enviar resumen diario (ejecutar manualmente o con cron)
  async enviarResumenDiario() {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          IdNotificacion, Tipo, Titulo, Mensaje, Prioridad,
          FechaCreacion
        FROM Notificaciones
        WHERE Leida = FALSE
          AND Prioridad IN ('critica', 'alta')
        ORDER BY 
          FIELD(Prioridad, 'critica', 'alta'),
          FechaCreacion DESC
        LIMIT 20
      `);

      if (rows.length === 0) {
        console.log('✅ No hay notificaciones pendientes para resumen diario');
        return;
      }

      const notificaciones: Notificacion[] = rows.map(row => ({
        IdNotificacion: row.IdNotificacion,
        Tipo: row.Tipo,
        Titulo: row.Titulo,
        Mensaje: row.Mensaje,
        Prioridad: row.Prioridad,
        Leida: false,
        FechaCreacion: row.FechaCreacion
      }));

      await emailService.enviarResumenDiario(notificaciones);
      console.log('✅ Resumen diario enviado');
    } catch (error) {
      console.error('❌ Error al enviar resumen diario:', error);
    }
  }
}

export const emailWorker = new EmailWorker();