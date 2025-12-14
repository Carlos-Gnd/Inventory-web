// frontend/src/services/api.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos máximo de espera
});

// Interceptor de Request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Verificar si la petición pidió ser "silenciosa" (no cerrar sesión globalmente)
    const isSilent = (error.config as any)?.headers?.['x-silent-error'];

    // Si es error 401 (No autorizado) Y NO es una petición silenciosa
    if (error.response?.status === 401 && !isSilent) {
      console.warn('⚠️ Sesión expirada. Cerrando sesión...');
      useAuthStore.getState().logout();
    }

    // Si es un error de cancelación o red (típico de antivirus), solo lo logueamos
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Error de red o conexión abortada (posible bloqueo de antivirus).');
    }

    return Promise.reject(error);
  }
);

export default api;