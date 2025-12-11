// frontend/src/components/common/BarcodeDisplay.tsx

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';

interface BarcodeDisplayProps {
  value: string;
  showValue?: boolean;
  width?: number;
  height?: number;
  format?: 'CODE128' | 'EAN13' | 'CODE39';
  displayValue?: boolean;
  className?: string;
}

export default function BarcodeDisplay({
  value,
  showValue = true,
  width = 2,
  height = 50,
  format = 'CODE128',
  displayValue = true,
  className = ''
}: BarcodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(showValue);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar código');
    }
  };

  if (!value) {
    return (
      <div className={`text-center py-4 text-gray-400 dark:text-gray-500 ${className}`}>
        <p className="text-sm">Sin código de barras</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Código de Barras Visual */}
      {visible && (
        <div className="bg-white p-4 rounded-lg inline-block border border-gray-200 dark:border-gray-700">
          <Barcode
            value={value}
            format={format}
            width={width}
            height={height}
            displayValue={displayValue}
            background="transparent"
            lineColor="#000000"
          />
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-2">
        {/* Toggle Visibilidad */}
        <button
          onClick={() => setVisible(!visible)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title={visible ? 'Ocultar código' : 'Mostrar código'}
        >
          {visible ? (
            <>
              <EyeOff className="w-4 h-4" />
              Ocultar
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Mostrar
            </>
          )}
        </button>

        {/* Valor del Código */}
        <span className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100">
          {value}
        </span>

        {/* Copiar */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
            copied
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/30'
          }`}
          title="Copiar código"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Componente simple para mostrar solo el código
export function BarcodeLabel({ value }: { value: string }) {
  if (!value) return null;

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
      <span className="w-4 h-4 bg-gradient-to-r from-gray-800 to-gray-600 rounded" />
      {value}
    </div>
  );
}