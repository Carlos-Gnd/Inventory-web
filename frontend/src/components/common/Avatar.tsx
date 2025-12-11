// frontend/src/components/common/Avatar.tsx - NUEVO ARCHIVO

import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  nombre?: string;
  apellido?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ 
  src, 
  alt, 
  nombre = '', 
  apellido = '', 
  size = 'md',
  className = '' 
}: AvatarProps) {
  // Obtener iniciales
  const getInitials = () => {
    const inicial1 = nombre?.charAt(0).toUpperCase() || '';
    const inicial2 = apellido?.charAt(0).toUpperCase() || '';
    return `${inicial1}${inicial2}` || '??';
  };

  // Generar color de fondo basado en el nombre
  const getBackgroundColor = () => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    const hash = (nombre + apellido).split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div 
      className={`
        ${sizes[size]} 
        rounded-full 
        flex items-center justify-center 
        overflow-hidden 
        border-2 border-white dark:border-gray-700
        shadow-md
        ${className}
      `}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || `${nombre} ${apellido}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Si la imagen falla al cargar, mostrar iniciales
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : nombre || apellido ? (
        <div className={`${getBackgroundColor()} w-full h-full flex items-center justify-center text-white font-bold`}>
          {getInitials()}
        </div>
      ) : (
        <div className="bg-gray-400 dark:bg-gray-600 w-full h-full flex items-center justify-center text-white">
          <User className={iconSizes[size]} />
        </div>
      )}
    </div>
  );
}