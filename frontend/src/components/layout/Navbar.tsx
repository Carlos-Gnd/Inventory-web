// frontend/src/components/layout/Navbar.tsx

import { Menu, Bell, LogOut, Package, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ThemeToggle from '../common/ThemeToggle';
import Avatar from '../common/Avatar';
import NotificationBell from '../common/NotificationBell';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  const getRoleBadge = () => {
    const role = user?.IdRol === 1 ? 'Administrador' : 'Cajero';
    const colorClass = user?.IdRol === 1
      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {role}
      </span>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 transition-colors duration-200">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart Inventory</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {/* Avatar actualizado */}
              <Avatar
                src={user?.FotoPerfil}
                nombre={user?.Nombre}
                apellido={user?.Apellido}
                size="md"
              />
              
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.Nombre} {user?.Apellido}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.UsuarioNombre}</p>
              </div>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={user?.FotoPerfil}
                      nombre={user?.Nombre}
                      apellido={user?.Apellido}
                      size="lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.Nombre} {user?.Apellido}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {user?.UsuarioNombre}
                      </p>
                      {user?.Email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.Email}
                        </p>
                      )}
                    </div>
                  </div>
                  {getRoleBadge()}
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/mi-perfil');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Mi Perfil
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}