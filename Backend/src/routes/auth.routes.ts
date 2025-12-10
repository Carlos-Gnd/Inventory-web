// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { HistorialSesionRepository } from '../repositories/historialSesion.repository';
import { hashPasswordSHA256, generateToken } from '../utils/auth';
import { extractClientInfo } from '../utils/userAgent';

const router = Router();
const usuarioRepo = new UsuarioRepository();
const historialRepo = new HistorialSesionRepository();

// Login CON registro de historial
router.post('/login', async (req, res) => {
  const clientInfo = extractClientInfo(req);
  
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
      // Registrar intento fallido (si encontramos el usuario por nombre)
      const usuarios = await usuarioRepo.listar();
      const userByUsername = usuarios.find(u => u.UsuarioNombre === usuario);
      
      if (userByUsername) {
        await historialRepo.registrar({
          IdUsuario: userByUsername.IdUsuario!,
          DireccionIP: clientInfo.ip,
          Navegador: clientInfo.navegador,
          Dispositivo: clientInfo.dispositivo,
          SistemaOperativo: clientInfo.sistemaOperativo,
          Exitoso: false,
          MotivoFallo: 'Contraseña incorrecta'
        });
      }

      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Registrar sesión exitosa
    await historialRepo.registrar({
      IdUsuario: user.IdUsuario!,
      DireccionIP: clientInfo.ip,
      Navegador: clientInfo.navegador,
      Dispositivo: clientInfo.dispositivo,
      SistemaOperativo: clientInfo.sistemaOperativo,
      Exitoso: true
    });

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