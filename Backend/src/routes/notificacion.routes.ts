// Backend/src/routes/notificacion.routes.ts
import { Router, Response } from 'express';
import { NotificacionRepository } from '../repositories/notificacion.repository';
import { authMiddleware, isAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const notifRepo = new NotificacionRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Listar notificaciones
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leida, prioridad, tipo, limite } = req.query;
    
    const filtros = {
      leida: leida === 'true' ? true : leida === 'false' ? false : undefined,
      prioridad: prioridad as string,
      tipo: tipo as string,
      limite: limite ? parseInt(limite as string) : 50
    };
    
    const notificaciones = await notifRepo.listar(filtros);
    res.json(notificaciones);
  } catch (error) {
    console.error('Error al listar notificaciones:', error);
    res.status(500).json({ error: 'Error al listar notificaciones' });
  }
});

// Obtener estadísticas
router.get('/estadisticas', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await notifRepo.obtenerEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Marcar como leída
router.put('/:id/leer', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idNotificacion = parseInt(req.params.id);
    const resultado = await notifRepo.marcarLeida(idNotificacion);
    
    if (resultado) {
      res.json({ message: 'Notificación marcada como leída' });
    } else {
      res.status(404).json({ error: 'Notificación no encontrada' });
    }
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
});

// Marcar todas como leídas
router.put('/leer-todas', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idUsuario = req.user?.userId;
    const count = await notifRepo.marcarTodasLeidas(idUsuario);
    
    res.json({ 
      message: `${count} notificaciones marcadas como leídas`,
      count 
    });
  } catch (error) {
    console.error('Error al marcar todas:', error);
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
});

// Eliminar notificación (solo admin)
router.delete('/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idNotificacion = parseInt(req.params.id);
    const resultado = await notifRepo.eliminar(idNotificacion);
    
    if (resultado) {
      res.json({ message: 'Notificación eliminada' });
    } else {
      res.status(404).json({ error: 'Notificación no encontrada' });
    }
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// Limpiar notificaciones antiguas (solo admin)
router.delete('/limpiar/antiguas', isAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await notifRepo.limpiarAntiguas();
    res.json({ 
      message: `${count} notificaciones antiguas eliminadas`,
      count 
    });
  } catch (error) {
    console.error('Error al limpiar notificaciones:', error);
    res.status(500).json({ error: 'Error al limpiar notificaciones' });
  }
});

export default router;