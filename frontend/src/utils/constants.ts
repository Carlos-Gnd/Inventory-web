// frontend/src/utils/constants.ts

/**
 * Métodos de pago disponibles
 */
export const METODOS_PAGO = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito' },
  { value: 'Tarjeta de Débito', label: 'Tarjeta de Débito' },
  { value: 'Transferencia', label: 'Transferencia' }
] as const;

/**
 * Roles de usuario
 */
export const ROLES = {
  ADMIN: 1,
  CAJERO: 2
} as const;

/**
 * Estados de producto
 */
export const ESTADO_PRODUCTO = {
  ACTIVO: true,
  INACTIVO: false
} as const;

/**
 * Configuración de paginación
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
} as const;

/**
 * Límites de campos
 */
export const FIELD_LIMITS = {
  NOMBRE_MAX: 100,
  DESCRIPCION_MAX: 255,
  COMENTARIO_MAX: 255,
  PASSWORD_MIN: 6
} as const;

/**
 * Colores para gráficos
 */
export const CHART_COLORS = {
  PRIMARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6'
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_NUMBER: 'Debe ser un número válido',
  INVALID_PRICE: 'El precio debe ser mayor a 0',
  INVALID_STOCK: 'El stock debe ser un número entero no negativo',
  PASSWORD_MIN: 'La contraseña debe tener al menos 6 caracteres',
  MAX_LENGTH: (max: number) => `Máximo ${max} caracteres`,
  MIN_LENGTH: (min: number) => `Mínimo ${min} caracteres`
} as const;

/**
 * Mensajes de éxito
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Registro creado exitosamente',
  UPDATED: 'Registro actualizado exitosamente',
  DELETED: 'Registro eliminado exitosamente',
  SAVED: 'Cambios guardados exitosamente'
} as const;

/**
 * Configuración de toast
 */
export const TOAST_CONFIG = {
  DURATION: 3000,
  SUCCESS_DURATION: 2000,
  ERROR_DURATION: 4000
} as const;