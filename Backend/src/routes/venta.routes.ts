import { Router } from 'express';
import { VentaRepository } from '../repositories/venta.repository';
import { authMiddleware, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();
const ventaRepo = new VentaRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Listar todas las ventas (solo admin)
router.get('/', isAdmin, async (req, res) => {
  try {
    const ventas = await ventaRepo.listar();
    res.json(ventas);
  } catch (error: any) {
    console.error('Error al listar ventas:', error);
    res.status(500).json({ error: 'Error al listar ventas' });
  }
});

// Listar ventas por usuario (cajero ve solo sus ventas)
router.get('/usuario/:idUsuario', async (req: AuthRequest, res) => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);

    // Verificar que sea admin o el mismo usuario
    if (req.user?.role !== 1 && req.user?.userId !== idUsuario) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const ventas = await ventaRepo.listarPorUsuario(idUsuario);
    res.json(ventas);
  } catch (error: any) {
    console.error('Error al listar ventas por usuario:', error);
    res.status(500).json({ error: 'Error al listar ventas por usuario' });
  }
});

// Listar ventas por rango de fechas
router.get('/fechas', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' });
    }

    const inicio = new Date(fechaInicio as string);
    const fin = new Date(fechaFin as string);

    const ventas = await ventaRepo.listarPorFechas(inicio, fin);
    res.json(ventas);
  } catch (error: any) {
    console.error('Error al listar ventas por fechas:', error);
    res.status(500).json({ error: 'Error al listar ventas por fechas' });
  }
});

// Obtener detalle de una venta
router.get('/:id/detalle', async (req, res) => {
  try {
    const idVenta = parseInt(req.params.id);
    const detalle = await ventaRepo.obtenerDetalleVenta(idVenta);
    res.json(detalle);
  } catch (error: any) {
    console.error('Error al obtener detalle de venta:', error);
    res.status(500).json({ error: 'Error al obtener detalle de venta' });
  }
});

// Registrar venta
router.post(
  '/',
  [
    body('IdUsuario').isInt({ min: 1 }).withMessage('Usuario es requerido'),
    body('Total').isFloat({ min: 0.01 }).withMessage('Total debe ser mayor a 0'),
    body('MetodoPago').notEmpty().withMessage('Método de pago es requerido'),
    body('DetallesVenta').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto')
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Verificar que el usuario esté registrando su propia venta o sea admin
      const { IdUsuario, DetallesVenta } = req.body;
      
      if (req.user?.role !== 1 && req.user?.userId !== IdUsuario) {
        return res.status(403).json({ error: 'No puede registrar ventas para otro usuario' });
      }

      // Verificar stock de cada producto
      for (const detalle of DetallesVenta) {
        const stockVerificado = await ventaRepo.verificarStock(
          detalle.IdProducto,
          detalle.Cantidad
        );

        if (!stockVerificado.disponible) {
          return res.status(400).json({ error: stockVerificado.mensaje });
        }
      }

      // Registrar venta
      const venta = {
        ...req.body,
        Fecha: new Date(),
        FechaVenta: new Date(),
        Estado: true
      };

      const idVenta = await ventaRepo.registrarVenta(venta);
      res.status(201).json({ 
        message: 'Venta registrada exitosamente', 
        idVenta 
      });
    } catch (error: any) {
      console.error('Error al registrar venta:', error);
      res.status(500).json({ error: 'Error al registrar venta' });
    }
  }
);

// Verificar stock disponible
router.post('/verificar-stock', async (req, res) => {
  try {
    const { IdProducto, Cantidad } = req.body;

    if (!IdProducto || !Cantidad) {
      return res.status(400).json({ error: 'IdProducto y Cantidad son requeridos' });
    }

    const resultado = await ventaRepo.verificarStock(IdProducto, Cantidad);
    res.json(resultado);
  } catch (error: any) {
    console.error('Error al verificar stock:', error);
    res.status(500).json({ error: 'Error al verificar stock' });
  }
});

export default router;