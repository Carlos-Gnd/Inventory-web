// frontend/src/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const isAdmin = user?.IdRol === 1;
  const isCajero = user?.IdRol === 2;

  return {
    user,
    isAuthenticated,
    isAdmin,
    isCajero,
    login,
    logout
  };
};

