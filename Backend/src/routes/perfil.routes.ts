// Backend/src/routes/perfil.routes.ts - MEJORADO
import { Router, Response } from 'express';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { authMiddleware, AuthRequest, isAdmin } from '../middleware/auth.middleware';
import { body, validationResult } from 'express-validator';
import { hashPasswordSHA256 } from '../utils/auth';

const router = Router();
const usuarioRepo = new UsuarioRepository();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ==================== RUTAS DE USUARIO COMÚN ====================

// Obtener perfil del usuario actual
router.get('/mi-perfil', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idUsuario = req.user?.userId;
    if (!idUsuario) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const usuario = await usuarioRepo.obtenerPorId(idUsuario);
    
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const { ClaveHash, ...usuarioSinClave } = usuario;
    res.json(usuarioSinClave);
  } catch (error: any) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil del usuario actual
router.put(
  '/mi-perfil',
  [
    body('Nombre')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
    body('Apellido')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Apellido debe tener entre 1 y 100 caracteres'),
    body('Telefono')
      .optional()
      .trim()
      .matches(/^[0-9\-\s\+\(\)]*$/)
      .withMessage('Teléfono inválido')
      .isLength({ max: 20 })
      .withMessage('Teléfono no puede exceder 20 caracteres'),
    body('Email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Email inválido')
      .isLength({ max: 100 })
      .withMessage('Email no puede exceder 100 caracteres'),
    body('Direccion')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Dirección no puede exceder 255 caracteres'),
    body('FechaNacimiento')
      .optional()
      .isISO8601()
      .withMessage('Fecha de nacimiento inválida'),
    body('FotoPerfil')
      .optional()
      .custom((value) => {
        if (!value) return true;
        
        if (value.startsWith('data:image')) {
          const sizeInBytes = (value.length * 3) / 4;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          if (sizeInMB > 2) {
            throw new Error('La imagen no puede exceder 2MB');
          }
          return true;
        }
        
        try {
          new URL(value);
          return true;
        } catch {
          throw new Error('Formato de imagen inválido');
        }
      })
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = req.user?.userId;
      if (!idUsuario) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const datos = req.body;
      const actualizado = await usuarioRepo.actualizarPerfil(idUsuario, datos);

      if (!actualizado) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const usuarioActualizado = await usuarioRepo.obtenerPorId(idUsuario);
      
      if (usuarioActualizado) {
        const { ClaveHash, ...usuarioSinClave } = usuarioActualizado;
        res.json({
          message: 'Perfil actualizado exitosamente',
          usuario: usuarioSinClave
        });
      } else {
        res.status(404).json({ error: 'Error al obtener usuario actualizado' });
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

// Cambiar MI contraseña (usuario propio)
router.put(
  '/mi-perfil/cambiar-clave',
  [
    body('claveActual')
      .notEmpty()
      .withMessage('Contraseña actual es requerida'),
    body('claveNueva')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = req.user?.userId;
      if (!idUsuario) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { claveActual, claveNueva } = req.body;

      // Verificar contraseña actual
      const usuario = await usuarioRepo.obtenerPorId(idUsuario);
      if (!usuario) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const claveActualHash = hashPasswordSHA256(claveActual);
      if (usuario.ClaveHash !== claveActualHash) {
        res.status(401).json({ error: 'Contraseña actual incorrecta' });
        return;
      }

      // Actualizar contraseña
      const nuevaClaveHash = hashPasswordSHA256(claveNueva);
      const actualizado = await usuarioRepo.cambiarClave(idUsuario, nuevaClaveHash);

      if (actualizado) {
        res.json({ message: 'Contraseña actualizada exitosamente' });
      } else {
        res.status(500).json({ error: 'Error al actualizar contraseña' });
      }
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
  }
);

// Actualizar solo la foto
router.put(
  '/mi-perfil/foto',
  [
    body('FotoPerfil')
      .notEmpty()
      .withMessage('La foto es requerida')
      .custom((value) => {
        if (value.startsWith('data:image')) {
          const sizeInBytes = (value.length * 3) / 4;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          if (sizeInMB > 2) {
            throw new Error('La imagen no puede exceder 2MB');
          }
          return true;
        }
        throw new Error('Formato de imagen inválido');
      })
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = req.user?.userId;
      if (!idUsuario) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const { FotoPerfil } = req.body;
      const actualizado = await usuarioRepo.actualizarPerfil(idUsuario, { FotoPerfil });

      if (!actualizado) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json({
        message: 'Foto de perfil actualizada exitosamente',
        FotoPerfil
      });
    } catch (error: any) {
      console.error('Error al actualizar foto:', error);
      res.status(500).json({ error: 'Error al actualizar foto' });
    }
  }
);

// Eliminar foto de perfil
router.delete('/mi-perfil/foto', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idUsuario = req.user?.userId;
    if (!idUsuario) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const actualizado = await usuarioRepo.actualizarPerfil(idUsuario, { FotoPerfil: undefined });

    if (!actualizado) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: 'Foto de perfil eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ error: 'Error al eliminar foto' });
  }
});

// ==================== RUTAS ADMIN PARA GESTIÓN DE USUARIOS ====================

// Obtener perfil de otro usuario (solo admin)
router.get('/usuarios/:id', isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.id);
    const usuario = await usuarioRepo.obtenerPorId(idUsuario);
    
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const { ClaveHash, ...usuarioSinClave } = usuario;
    res.json(usuarioSinClave);
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Actualizar perfil de otro usuario (solo admin)
router.put(
  '/usuarios/:id',
  isAdmin,
  [
    body('Nombre').optional().trim().isLength({ min: 1, max: 100 }),
    body('Apellido').optional().trim().isLength({ min: 1, max: 100 }),
    body('Email').optional().trim().isEmail(),
    body('Telefono').optional().trim().matches(/^[0-9\-\s\+\(\)]*$/),
    body('Direccion').optional().trim().isLength({ max: 255 }),
    body('FechaNacimiento').optional().isISO8601()
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = parseInt(req.params.id);
      const datos = req.body;
      
      const actualizado = await usuarioRepo.actualizarPerfil(idUsuario, datos);

      if (!actualizado) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const usuarioActualizado = await usuarioRepo.obtenerPorId(idUsuario);
      
      if (usuarioActualizado) {
        const { ClaveHash, ...usuarioSinClave } = usuarioActualizado;
        res.json({
          message: 'Usuario actualizado exitosamente',
          usuario: usuarioSinClave
        });
      }
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
);

// Cambiar contraseña de otro usuario (solo admin)
router.put(
  '/usuarios/:id/cambiar-clave',
  isAdmin,
  [
    body('claveNueva')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const idUsuario = parseInt(req.params.id);
      const { claveNueva } = req.body;

      const nuevaClaveHash = hashPasswordSHA256(claveNueva);
      const actualizado = await usuarioRepo.cambiarClave(idUsuario, nuevaClaveHash);

      if (actualizado) {
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

export default router;