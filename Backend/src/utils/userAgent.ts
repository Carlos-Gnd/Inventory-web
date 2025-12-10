// backend/src/utils/userAgent.ts
import { Request } from 'express';

export interface ClientInfo {
  ip: string;
  navegador: string;
  dispositivo: string;
  sistemaOperativo: string;
}

export const extractClientInfo = (req: Request): ClientInfo => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Extraer IP
  const ip = (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'Unknown'
  ).split(',')[0].trim();

  // Detectar navegador
  let navegador = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) navegador = 'Chrome';
  else if (userAgent.includes('Firefox')) navegador = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) navegador = 'Safari';
  else if (userAgent.includes('Edg')) navegador = 'Edge';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) navegador = 'Opera';

  // Detectar dispositivo
  let dispositivo = 'Desktop';
  if (/mobile/i.test(userAgent)) dispositivo = 'Mobile';
  else if (/tablet|ipad/i.test(userAgent)) dispositivo = 'Tablet';

  // Detectar SO
  let sistemaOperativo = 'Unknown';
  if (userAgent.includes('Windows')) sistemaOperativo = 'Windows';
  else if (userAgent.includes('Mac OS')) sistemaOperativo = 'macOS';
  else if (userAgent.includes('Linux')) sistemaOperativo = 'Linux';
  else if (userAgent.includes('Android')) sistemaOperativo = 'Android';
  else if (userAgent.includes('iOS')) sistemaOperativo = 'iOS';

  return {
    ip,
    navegador,
    dispositivo,
    sistemaOperativo
  };
};