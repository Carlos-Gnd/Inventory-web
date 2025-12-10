// frontend/src/components/common/ThemeToggle.tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative p-2 rounded-lg transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        group
      "
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      aria-label="Toggle theme"
    >
      {/* Sol (visible en modo oscuro) */}
      <Sun 
        className="
          w-5 h-5 text-gray-300 transition-all duration-300
          dark:rotate-0 dark:scale-100 rotate-90 scale-0
          group-hover:text-yellow-400
        " 
      />
      
      {/* Luna (visible en modo claro) */}
      <Moon 
        className="
          absolute inset-0 m-auto w-5 h-5 text-gray-600 transition-all duration-300
          dark:rotate-90 dark:scale-0 rotate-0 scale-100
          group-hover:text-blue-600 dark:group-hover:text-blue-400
        " 
      />
    </button>
  );
}