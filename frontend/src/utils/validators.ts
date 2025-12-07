// frontend/src/utils/validators.ts

/**
 * Valida email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que un string no esté vacío
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Valida longitud mínima
 */
export const minLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

/**
 * Valida longitud máxima
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

/**
 * Valida que sea un número positivo
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Valida que sea un número no negativo
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return !isNaN(value) && value >= 0;
};

/**
 * Valida que sea un número entero
 */
export const isInteger = (value: number): boolean => {
  return Number.isInteger(value);
};

/**
 * Valida precio
 */
export const isValidPrice = (value: number): boolean => {
  return isPositiveNumber(value) && value < 1000000;
};

/**
 * Valida stock
 */
export const isValidStock = (value: number): boolean => {
  return isNonNegativeNumber(value) && isInteger(value);
};

/**
 * Valida contraseña (mínimo 6 caracteres)
 */
export const isValidPassword = (password: string): boolean => {
  return minLength(password, 6);
};

