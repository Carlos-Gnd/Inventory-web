import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';

// Routes
import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import categoriaRoutes from './routes/categoria.routes';
import productoRoutes from './routes/producto.routes';
import ventaRoutes from './routes/venta.routes';
import reporteRoutes from './routes/reporte.routes';
import historialSesionRoutes from './routes/historialSesion.routes';
import perfilRoutes from './routes/perfil.routes';
import notificacionRoutes from './routes/notificacion.routes';
import { emailWorker } from './workers/emailWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
// }));

// Middleware
const allowedOrigins = [
  'http://localhost:5173',               // Tu entorno local
  'http://127.0.0.1:5173',               // Alternativa local
  process.env.CORS_ORIGIN,               // Variable de entorno (opcional)
  'http://52.234.38.80',          // <--- ¡AQUÍ PONES TU IP DE AZURE!
  'http://52.234.38.80:5173'      // Por si decides usar el puerto 5173
].filter(Boolean); // Elimina valores nulos/undefined

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman, cURL o apps móviles)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('Bloqueado por CORS:', origin); // Útil para depurar en los logs de Docker
      return callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true // Importante para cookies/sesiones
}));

app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// ENDPOINT DE SALUD
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Smart Inventory API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/historial-sesiones', historialSesionRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// Start server
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📡 API disponible en http://localhost:${PORT}/api`);

      // Iniciar email worker
      emailWorker.start();
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar señales de cierre
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recibido, cerrando worker...');
  emailWorker.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT recibido, cerrando worker...');
  emailWorker.stop();
  process.exit(0);
});

startServer();