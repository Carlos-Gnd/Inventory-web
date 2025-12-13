// Backend/src/services/emailService.ts
import nodemailer, { Transporter } from 'nodemailer';
import { Notificacion } from '../models';

class EmailService {
  private transporter: Transporter | null = null;
  private enabled: boolean;
  private adminEmail: string;

  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    this.adminEmail = process.env.EMAIL_ADMIN || 'admin@smartinventory.com';

    if (this.enabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Verificar conexión
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ Error al conectar con servidor de email:', error);
          this.enabled = false;
        } else {
          console.log('✅ Servidor de email conectado correctamente');
        }
      });
    } catch (error) {
      console.error('❌ Error al inicializar transporter de email:', error);
      this.enabled = false;
    }
  }

  // Enviar notificación por email
  async enviarNotificacion(notificacion: Notificacion): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      console.log('⚠️ Email deshabilitado o no configurado');
      return false;
    }

    // Solo enviar emails para notificaciones críticas o de alta prioridad
    if (!['critica', 'alta'].includes(notificacion.Prioridad)) {
      return false;
    }

    try {
      const html = this.generarHTMLNotificacion(notificacion);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Smart Inventory <noreply@smartinventory.com>',
        to: this.adminEmail,
        subject: `🚨 ${notificacion.Titulo}`,
        html
      });

      console.log(`✅ Email enviado: ${notificacion.Titulo}`);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      return false;
    }
  }

  // Generar HTML del email
  private generarHTMLNotificacion(notificacion: Notificacion): string {
    const prioridadColor = {
      critica: '#DC2626',
      alta: '#F97316',
      media: '#3B82F6',
      baja: '#6B7280'
    }[notificacion.Prioridad];

    const prioridadEmoji = {
      critica: '🚨',
      alta: '⚠️',
      media: 'ℹ️',
      baja: '📌'
    }[notificacion.Prioridad];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificación - Smart Inventory</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                      📦 Smart Inventory
                    </h1>
                  </td>
                </tr>

                <!-- Prioridad Badge -->
                <tr>
                  <td style="padding: 20px 30px 0;">
                    <div style="display: inline-block; background-color: ${prioridadColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                      ${prioridadEmoji} ${notificacion.Prioridad}
                    </div>
                  </td>
                </tr>

                <!-- Título -->
                <tr>
                  <td style="padding: 20px 30px 10px;">
                    <h2 style="margin: 0; color: #111827; font-size: 20px;">
                      ${notificacion.Titulo}
                    </h2>
                  </td>
                </tr>

                <!-- Mensaje -->
                <tr>
                  <td style="padding: 10px 30px 20px;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ${notificacion.Mensaje}
                    </p>
                  </td>
                </tr>

                ${notificacion.Producto ? `
                <!-- Información del Producto -->
                <tr>
                  <td style="padding: 0 30px 20px;">
                    <table width="100%" cellpadding="10" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                      <tr>
                        <td>
                          <strong style="color: #92400e;">Producto:</strong>
                          <span style="color: #78350f;">${notificacion.Producto.Nombre}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong style="color: #92400e;">Stock Actual:</strong>
                          <span style="color: #dc2626; font-weight: bold;">${notificacion.Producto.Stock}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong style="color: #92400e;">Stock Mínimo:</strong>
                          <span style="color: #78350f;">${notificacion.Producto.StockMinimo}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Call to Action -->
                <tr>
                  <td style="padding: 20px 30px;">
                    <a href="http://localhost:5173/productos" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Ver en el Sistema
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      Este es un mensaje automático de Smart Inventory<br>
                      <strong>Fecha:</strong> ${new Date().toLocaleString('es-SV')}
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Enviar reporte diario de notificaciones críticas
  async enviarResumenDiario(notificaciones: Notificacion[]): Promise<boolean> {
    if (!this.enabled || !this.transporter || notificaciones.length === 0) {
      return false;
    }

    try {
      const html = this.generarHTMLResumen(notificaciones);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Smart Inventory <noreply@smartinventory.com>',
        to: this.adminEmail,
        subject: `📊 Resumen Diario - ${notificaciones.length} Notificaciones Pendientes`,
        html
      });

      console.log('✅ Resumen diario enviado');
      return true;
    } catch (error) {
      console.error('❌ Error al enviar resumen diario:', error);
      return false;
    }
  }

  private generarHTMLResumen(notificaciones: Notificacion[]): string {
    const criticas = notificaciones.filter(n => n.Prioridad === 'critica').length;
    const altas = notificaciones.filter(n => n.Prioridad === 'alta').length;

    const listaNotificaciones = notificaciones.map(n => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          <strong>${n.Titulo}</strong><br>
          <span style="color: #6b7280; font-size: 13px;">${n.Mensaje}</span>
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumen Diario - Smart Inventory</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: white;">📊 Resumen Diario</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9);">${new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div style="padding: 30px;">
            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
              <div style="flex: 1; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
                <div style="color: #7f1d1d; font-size: 24px; font-weight: bold;">${criticas}</div>
                <div style="color: #991b1b; font-size: 12px;">Críticas</div>
              </div>
              <div style="flex: 1; padding: 15px; background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
                <div style="color: #7c2d12; font-size: 24px; font-weight: bold;">${altas}</div>
                <div style="color: #9a3412; font-size: 12px;">Alta Prioridad</div>
              </div>
            </div>

            <h3 style="color: #111827; margin-bottom: 15px;">Notificaciones Pendientes</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${listaNotificaciones}
            </table>

            <div style="margin-top: 30px; text-align: center;">
              <a href="http://localhost:5173/productos" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Ver en el Sistema
              </a>
            </div>
          </div>

          <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              Smart Inventory - Sistema de Gestión
            </p>
          </div>

        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();