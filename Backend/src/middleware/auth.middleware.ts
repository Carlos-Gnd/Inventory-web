import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: number;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      res.status(401).json({ error: 'No se proporcionó token de autenticación' });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 1) {
    res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    return;
  }
  next();
};