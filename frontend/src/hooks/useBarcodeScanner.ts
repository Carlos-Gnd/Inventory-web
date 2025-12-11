// frontend/src/hooks/useBarcodeScanner.ts

import { useEffect, useCallback, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (code: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number;
  enabled?: boolean;
}

/**
 * Hook para detectar escaneo de códigos de barras con lectores USB
 * 
 * Los lectores USB típicamente envían:
 * 1. Los caracteres del código muy rápido (< 100ms entre caracteres)
 * 2. Un Enter al final
 * 
 * Este hook detecta ese patrón y ejecuta el callback con el código escaneado.
 */
export function useBarcodeScanner({
  onScan,
  minLength = 8,
  maxLength = 20,
  timeout = 100,
  enabled = true
}: BarcodeScannerOptions) {
  const buffer = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetBuffer = useCallback(() => {
    buffer.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignorar si el usuario está escribiendo en un input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const char = event.key;

      // Si es Enter, procesar el buffer
      if (char === 'Enter') {
        const code = buffer.current.trim();
        
        if (code.length >= minLength && code.length <= maxLength) {
          onScan(code);
          resetBuffer();
        } else {
          // Código inválido, resetear
          resetBuffer();
        }
        
        event.preventDefault();
        return;
      }

      // Si es un carácter alfanumérico, agregarlo al buffer
      if (/^[a-zA-Z0-9]$/.test(char)) {
        buffer.current += char;

        // Resetear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Si pasa mucho tiempo entre caracteres, asumir que no es un scanner
        timeoutRef.current = setTimeout(() => {
          resetBuffer();
        }, timeout);
      }
    },
    [enabled, minLength, maxLength, timeout, onScan, resetBuffer]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keypress', handleKeyPress);
    
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      resetBuffer();
    };
  }, [enabled, handleKeyPress, resetBuffer]);

  return { resetBuffer };
}

// Versión alternativa: detectar escaneo en un input específico
export function useBarcodeInput(
  inputRef: React.RefObject<HTMLInputElement>,
  onScan: (code: string) => void,
  delay: number = 50
) {
  const lastKeyTime = useRef<number>(0);
  const buffer = useRef<string>('');

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTime.current;

      // Si los caracteres llegan muy rápido (< delay), es probablemente un scanner
      if (timeDiff < delay) {
        buffer.current += event.key;
      } else {
        buffer.current = event.key;
      }

      lastKeyTime.current = now;

      // Si es Enter y hay contenido en el buffer
      if (event.key === 'Enter' && buffer.current.length > 0) {
        event.preventDefault();
        const code = buffer.current.replace('Enter', '').trim();
        
        if (code) {
          onScan(code);
          input.value = '';
          buffer.current = '';
        }
      }
    };

    input.addEventListener('keydown', handleKeyDown);
    
    return () => {
      input.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef, onScan, delay]);
}