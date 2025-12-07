// frontend/src/utils/formatters.ts

/**
 * Formatea un número como moneda
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea una fecha
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
};

/**
 * Formatea fecha y hora
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
};

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-SV').format(num);
};

/**
 * Trunca texto largo
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza primera letra
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

