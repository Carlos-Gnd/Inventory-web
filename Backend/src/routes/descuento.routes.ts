// Backend/src/routes/descuento.routes.ts

import { Router, Response } from 'express';
import { DescuentoRepository } from '../repositories/descuento.repository';
import { authMiddleware, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();
const descuentoRepo = new DescuentoRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ==================== RUTAS PÚBLICAS (Cajeros y Admins) ====================

// Listar descuentos activos
router.get('/activos', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const descuentos = await descuentoRepo.listarActivos();
    res.json(descuentos);
  } catch (error) {
    console.error('Error al listar descuentos activos:', error);
    res.status(500).json({ error: 'Error al listar descuentos activos' });
  }
});

// Validar cupón
router.post('/validar-cupon', [
  body('codigo').notEmpty().withMessage('Código de cupón requerido'),
  body('montoCompra').isFloat({ min: 0 }).withMessage('Monto de compra inválido')
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { codigo, montoCompra } = req.body;
    const resultado = await descuentoRepo.validarCupon(codigo, montoCompra);
    
    res.json(resultado);
  } catch (error) {
    console.error('Error al validar cupón:', error);
    res.status(500).json({ error: 'Error al validar cupón' });
  }
});

// Calcular descuento
router.post('/calcular', [
  body('idDescuento').isInt().withMessage('ID de descuento requerido'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal inválido')
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { idDescuento, subtotal, idProducto, cantidad } = req.body;
    const itemSimulado = {
        IdProducto: idProducto,
        Cantidad: cantidad,
        PrecioUnitario: 0, // No necesario para este cálculo
        Subtotal: subtotal
    };

    const montoDescuento = await descuentoRepo.calcularDescuentoItem(
      idDescuento,
      itemSimulado
    );
    
    res.json({ montoDescuento });
  } catch (error) {
    console.error('Error al calcular descuento:', error);
    res.status(500).json({ error: 'Error al calcular descuento' });
  }
});

// ==================== RUTAS ADMIN ====================

// Listar todos los descuentos (solo admin)
router.get('/', isAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const descuentos = await descuentoRepo.listar();
    res.json(descuentos);
  } catch (error) {
    console.error('Error al listar descuentos:', error);
    res.status(500).json({ error: 'Error al listar descuentos' });
  }
});

// Obtener descuento por ID (solo admin)
router.get('/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const descuento = await descuentoRepo.obtenerPorId(id);
    
    if (!descuento) {
      res.status(404).json({ error: 'Descuento no encontrado' });
      return;
    }
    
    res.json(descuento);
  } catch (error) {
    console.error('Error al obtener descuento:', error);
    res.status(500).json({ error: 'Error al obtener descuento' });
  }
});

// Crear descuento (solo admin)
router.post('/', isAdmin, [
  body('Nombre').notEmpty().withMessage('Nombre requerido'),
  body('Tipo').isIn(['porcentaje', 'monto_fijo', '2x1', '3x2', 'combo']).withMessage('Tipo inválido'),
  body('FechaInicio').isISO8601().withMessage('Fecha de inicio inválida'),
  body('FechaFin').isISO8601().withMessage('Fecha fin inválida'),
  body('MontoMinimo').isFloat({ min: 0 }).withMessage('Monto mínimo inválido')
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const descuento = {
      ...req.body,
      CreadoPor: req.user?.userId
    };

    // Validaciones específicas por tipo
    if (descuento.Tipo === 'porcentaje' && (descuento.Valor < 0 || descuento.Valor > 100)) {
      res.status(400).json({ error: 'El porcentaje debe estar entre 0 y 100' });
      return;
    }

    if (descuento.Tipo === 'monto_fijo' && descuento.Valor <= 0) {
      res.status(400).json({ error: 'El monto fijo debe ser mayor a 0' });
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(descuento.FechaInicio);
    const fechaFin = new Date(descuento.FechaFin);
    
    if (fechaFin <= fechaInicio) {
      res.status(400).json({ error: 'La fecha fin debe ser posterior a la fecha de inicio' });
      return;
    }

    const id = await descuentoRepo.crear(descuento);
    res.status(201).json({ 
      message: 'Descuento creado exitosamente',
      idDescuento: id
    });
  } catch (error: any) {
    console.error('Error al crear descuento:', error);
    
    // Verificar error de cupón duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El código de cupón ya existe' });
      return;
    }
    
    res.status(500).json({ error: 'Error al crear descuento' });
  }
});

// Actualizar descuento (solo admin)
router.put('/:id', isAdmin, [
  body('Nombre').notEmpty().withMessage('Nombre requerido'),
  body('Tipo').isIn(['porcentaje', 'monto_fijo', '2x1', '3x2', 'combo']).withMessage('Tipo inválido'),
  body('FechaInicio').isISO8601().withMessage('Fecha de inicio inválida'),
  body('FechaFin').isISO8601().withMessage('Fecha fin inválida')
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const id = parseInt(req.params.id);
    const actualizado = await descuentoRepo.actualizar(id, req.body);
    
    if (!actualizado) {
      res.status(404).json({ error: 'Descuento no encontrado' });
      return;
    }
    
    res.json({ message: 'Descuento actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar descuento:', error);
    res.status(500).json({ error: 'Error al actualizar descuento' });
  }
});

// Eliminar descuento (solo admin)
router.delete('/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const eliminado = await descuentoRepo.eliminar(id);
    
    if (!eliminado) {
      res.status(404).json({ error: 'Descuento no encontrado' });
      return;
    }
    
    res.json({ message: 'Descuento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar descuento:', error);
    res.status(500).json({ error: 'Error al eliminar descuento' });
  }
});

// Activar/Desactivar descuento (solo admin)
router.patch('/:id/toggle', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const actualizado = await descuentoRepo.toggleActivo(id);
    
    if (!actualizado) {
      res.status(404).json({ error: 'Descuento no encontrado' });
      return;
    }
    
    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// Obtener estadísticas (solo admin)
router.get('/estadisticas/resumen', isAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const estadisticas = await descuentoRepo.obtenerEstadisticas();
    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;