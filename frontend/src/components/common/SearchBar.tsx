// frontend/src/components/common/SearchBar.tsx - CORREGIDO

import { Search } from 'lucide-react';
import { InputHTMLAttributes } from 'react';

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export default function SearchBar({ onSearch, className = '', ...props }: SearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      <input
        type="text"
        className={`
          w-full px-4 py-2 pl-10 border rounded-lg
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-gray-100
          placeholder-gray-500 dark:placeholder-gray-400
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all duration-200
          ${className}
        `}
        placeholder="Buscar..."
        {...props}
      />
    </div>
  );
}