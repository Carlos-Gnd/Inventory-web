// backend/src/routes/historialSesion.routes.ts
import { Router, Request, Response } from 'express';
import { HistorialSesionRepository } from '../repositories/historialSesion.repository';
import { authMiddleware, isAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const historialRepo = new HistorialSesionRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Listar todas las sesiones (solo admin)
router.get('/', isAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const limite = parseInt(_req.query.limite as string) || 100;
    const sesiones = await historialRepo.listar(limite);
    res.json(sesiones);
  } catch (error: any) {
    console.error('Error al listar sesiones:', error);
    res.status(500).json({ error: 'Error al listar sesiones' });
  }
});

// Listar sesiones de un usuario específico
router.get('/usuario/:idUsuario', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);

    // Verificar que sea admin o el mismo usuario
    if (req.user?.role !== 1 && req.user?.userId !== idUsuario) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    const limite = parseInt(req.query.limite as string) || 50;
    const sesiones = await historialRepo.listarPorUsuario(idUsuario, limite);
    res.json(sesiones);
  } catch (error: any) {
    console.error('Error al listar sesiones del usuario:', error);
    res.status(500).json({ error: 'Error al listar sesiones del usuario' });
  }
});

// Obtener estadísticas (admin ve todas, usuario ve solo las suyas)
router.get('/estadisticas/:idUsuario?', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idUsuario = req.params.idUsuario ? parseInt(req.params.idUsuario) : undefined;

    // Si no es admin, solo puede ver sus propias estadísticas
    if (req.user?.role !== 1) {
      if (!idUsuario || idUsuario !== req.user?.userId) {
        res.status(403).json({ error: 'No autorizado' });
        return;
      }
    }

    const stats = await historialRepo.obtenerEstadisticas(idUsuario);
    res.json(stats);
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;