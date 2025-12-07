import { Router } from 'express';
import { CategoriaRepository } from '../repositories/categoria.repository';
import { authMiddleware, isAdmin } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();
const categoriaRepo = new CategoriaRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Listar categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await categoriaRepo.listar();
    res.json(categorias);
  } catch (error: any) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({ error: 'Error al listar categorías' });
  }
});

// Registrar categoría (solo admin)
router.post(
  '/',
  isAdmin,
  [
    body('Nombre')
      .notEmpty().withMessage('Nombre es requerido')
      .isLength({ max: 100 }).withMessage('Nombre no puede exceder 100 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const categoria = req.body;
      const idCategoria = await categoriaRepo.registrar(categoria);
      res.status(201).json({ 
        message: 'Categoría registrada exitosamente', 
        idCategoria 
      });
    } catch (error: any) {
      console.error('Error al registrar categoría:', error);
      res.status(500).json({ error: 'Error al registrar categoría' });
    }
  }
);

// Editar categoría (solo admin)
router.put(
  '/:id',
  isAdmin,
  [
    body('Nombre')
      .notEmpty().withMessage('Nombre es requerido')
      .isLength({ max: 100 }).withMessage('Nombre no puede exceder 100 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const idCategoria = parseInt(req.params.id);
      const categoria = { ...req.body, IdCategoria: idCategoria };
      
      const resultado = await categoriaRepo.editar(categoria);
      if (resultado) {
        res.json({ message: 'Categoría actualizada exitosamente' });
      } else {
        res.status(404).json({ error: 'Categoría no encontrada' });
      }
    } catch (error: any) {
      console.error('Error al editar categoría:', error);
      res.status(500).json({ error: 'Error al editar categoría' });
    }
  }
);

// Eliminar categoría (solo admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const idCategoria = parseInt(req.params.id);
    const resultado = await categoriaRepo.eliminar(idCategoria);

    if (resultado) {
      res.json({ message: 'Categoría eliminada exitosamente' });
    } else {
      res.status(404).json({ error: 'Categoría no encontrada' });
    }
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    // Verificar si hay productos asociados
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).json({ 
        error: 'No se puede eliminar la categoría porque tiene productos asociados' 
      });
    } else {
      res.status(500).json({ error: 'Error al eliminar categoría' });
    }
  }
});

export default router;