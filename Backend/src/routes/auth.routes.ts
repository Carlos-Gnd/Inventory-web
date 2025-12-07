import { Router } from 'express';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { hashPasswordSHA256, generateToken } from '../utils/auth';

const router = Router();
const usuarioRepo = new UsuarioRepository();

// Login
router.post('/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Hash de la contraseña
    const claveHash = hashPasswordSHA256(clave);

    // Buscar usuario
    const user = await usuarioRepo.login(usuario, claveHash);

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar token
    const token = generateToken(user.IdUsuario!, user.UsuarioNombre, user.IdRol);

    // Remover el hash de la contraseña antes de enviar
    delete user.ClaveHash;

    res.json({
      message: 'Login exitoso',
      usuario: user,
      token
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al procesar el login' });
  }
});

export default router;