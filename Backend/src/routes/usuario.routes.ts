import { Router, Request, Response } from 'express';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { hashPasswordSHA256 } from '../utils/auth';
import { authMiddleware, isAdmin, AuthRequest } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';

const router = Router();
const usuarioRepo = new UsuarioRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Listar usuarios (solo admin)
router.get('/', isAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await usuarioRepo.listar();
    // Remover hashes de contraseñas
    const usuariosSinClave = usuarios.map(u => {
      const { ClaveHash, ...usuario } = u;
      return usuario;
    });
    res.json(usuariosSinClave);
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// Registrar usuario (solo admin)
router.post(
  '/',
  isAdmin,
  [
    body('Nombre').notEmpty().withMessage('Nombre es requerido'),
    body('Apellido').notEmpty().withMessage('Apellido es requerido'),
    body('UsuarioNombre').notEmpty().withMessage('Usuario es requerido'),
    body('ClaveHash').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
    body('IdRol').isInt().withMessage('Rol es requerido')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const usuario = req.body;
      usuario.ClaveHash = hashPasswordSHA256(usuario.ClaveHash);
      usuario.Activo = true;
      usuario.FechaRegistro = new Date();

      const idUsuario = await usuarioRepo.registrar(usuario);
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        idUsuario
      });
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
);

// Editar usuario (solo admin)
router.put(
  '/:id',
  isAdmin,
  [
    body('Nombre').notEmpty().withMessage('Nombre es requerido'),
    body('Apellido').notEmpty().withMessage('Apellido es requerido'),
    body('UsuarioNombre').notEmpty().withMessage('Usuario es requerido'),
    body('IdRol').isInt().withMessage('Rol es requerido')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = parseInt(req.params.id);
      const usuario = { ...req.body, IdUsuario: idUsuario };
      
      const resultado = await usuarioRepo.editar(usuario);
      if (resultado) {
        res.json({ message: 'Usuario actualizado exitosamente' });
      } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
      }
    } catch (error: any) {
      console.error('Error al editar usuario:', error);
      res.status(500).json({ error: 'Error al editar usuario' });
    }
  }
);

// Cambiar contraseña (usuario propio o admin)
router.put(
  '/:id/cambiar-clave',
  [
    body('nuevaClave').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = parseInt(req.params.id);
      const { nuevaClave } = req.body;

      // Verificar que sea admin o el mismo usuario
      if (req.user?.role !== 1 && req.user?.userId !== idUsuario) {
        res.status(403).json({ error: 'No autorizado' });
        return;
      }

      const nuevaClaveHash = hashPasswordSHA256(nuevaClave);
      const resultado = await usuarioRepo.cambiarClave(idUsuario, nuevaClaveHash);
      if (resultado) {
        res.json({ message: 'Contraseña actualizada exitosamente' });
      } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
      }
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
  }
);

// Eliminar (desactivar) usuario (solo admin)
router.delete('/:id', isAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.id);
    const resultado = await usuarioRepo.eliminar(idUsuario);
    if (resultado) {
      res.json({ message: 'Usuario eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;