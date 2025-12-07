import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const hashPasswordSHA256 = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const generateToken = (userId: number, username: string, role: number): string => {
  return jwt.sign(
    {
      userId,
      username,
      role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): { userId: number; username: string; role: number } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: number };
    return decoded;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};