import { Router, Request, Response } from 'express';
import { ProductoRepository } from '../repositories/producto.repository';
import { authMiddleware, isAdmin } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();
const productoRepo = new ProductoRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Listar productos
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await productoRepo.listar();
    res.json(productos);
  } catch (error: any) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ error: 'Error al listar productos' });
  }
});

// Obtener productos con stock bajo
router.get('/stock-bajo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await productoRepo.listar();
    const productosStockBajo = productos.filter(
      p => p.Stock <= p.StockMinimo && p.Estado
    );
    res.json(productosStockBajo);
  } catch (error: any) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({ error: 'Error al obtener productos con stock bajo' });
  }
});

// Registrar producto (solo admin)
router.post(
  '/',
  isAdmin,
  [
    body('Nombre')
      .notEmpty().withMessage('Nombre es requerido')
      .isLength({ max: 100 }).withMessage('Nombre no puede exceder 100 caracteres'),
    body('IdCategoria')
      .isInt({ min: 1 }).withMessage('Categoría es requerida'),
    body('Precio')
      .isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
    body('Stock')
      .isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),
    body('StockMinimo')
      .isInt({ min: 0 }).withMessage('Stock mínimo debe ser un número entero positivo')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const producto = {
        ...req.body,
        Estado: true,
        FechaRegistro: new Date(),
        EsProductoFinal: req.body.EsProductoFinal !== undefined ? req.body.EsProductoFinal : true
      };

      const idProducto = await productoRepo.registrar(producto);
      res.status(201).json({
        message: 'Producto registrado exitosamente',
        idProducto
      });
    } catch (error: any) {
      console.error('Error al registrar producto:', error);
      res.status(500).json({ error: 'Error al registrar producto' });
    }
  }
);

// Editar producto (solo admin)
router.put(
  '/:id',
  isAdmin,
  [
    body('Nombre')
      .notEmpty().withMessage('Nombre es requerido')
      .isLength({ max: 100 }).withMessage('Nombre no puede exceder 100 caracteres'),
    body('IdCategoria')
      .isInt({ min: 1 }).withMessage('Categoría es requerida'),
    body('Precio')
      .isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
    body('Stock')
      .isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),
    body('StockMinimo')
      .isInt({ min: 0 }).withMessage('Stock mínimo debe ser un número entero positivo')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idProducto = parseInt(req.params.id);
      const producto = { ...req.body, IdProducto: idProducto };
      
      const resultado = await productoRepo.editar(producto);
      if (resultado) {
        res.json({ message: 'Producto actualizado exitosamente' });
      } else {
        res.status(404).json({ error: 'Producto no encontrado' });
      }
    } catch (error: any) {
      console.error('Error al editar producto:', error);
      res.status(500).json({ error: 'Error al editar producto' });
    }
  }
);

// Eliminar (desactivar) producto (solo admin)
router.delete('/:id', isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const idProducto = parseInt(req.params.id);
    const resultado = await productoRepo.eliminar(idProducto);
    if (resultado) {
      res.json({ message: 'Producto eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Actualizar stock (usado internamente por ventas)
router.patch('/:id/stock', async (req: Request, res: Response): Promise<void> => {
  try {
    const idProducto = parseInt(req.params.id);
    const { cantidad } = req.body;

    if (!cantidad || cantidad <= 0) {
      res.status(400).json({ error: 'Cantidad inválida' });
      return;
    }

    const resultado = await productoRepo.actualizarStock(idProducto, cantidad);
    if (resultado) {
      res.json({ message: 'Stock actualizado exitosamente' });
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error: any) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

export default router;