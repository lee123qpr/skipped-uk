// Shared validation utilities for edge functions
// Note: We can't use zod in Deno edge functions easily, so we'll use manual validation

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  errors: ValidationError[];
  
  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

/**
 * Validates a UUID string
 */
export function validateUUID(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'Must be a string' }]);
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationException([{ field: fieldName, message: 'Invalid UUID format' }]);
  }
  
  return value;
}

/**
 * Validates a positive number (for amounts, fees, etc.)
 */
export function validatePositiveNumber(value: unknown, fieldName: string, min = 0): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) {
    throw new ValidationException([{ field: fieldName, message: 'Must be a number' }]);
  }
  
  if (num < min) {
    throw new ValidationException([{ field: fieldName, message: `Must be at least ${min}` }]);
  }
  
  if (!isFinite(num)) {
    throw new ValidationException([{ field: fieldName, message: 'Must be a finite number' }]);
  }
  
  return num;
}

/**
 * Validates an amount in pounds (max £100,000)
 */
export function validateAmount(value: unknown, fieldName: string): number {
  const amount = validatePositiveNumber(value, fieldName, 0.01);
  
  const MAX_AMOUNT = 100000;
  if (amount > MAX_AMOUNT) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `Amount cannot exceed £${MAX_AMOUNT.toLocaleString()}` 
    }]);
  }
  
  // Validate reasonable precision (max 2 decimal places)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: 'Amount cannot have more than 2 decimal places' 
    }]);
  }
  
  return amount;
}

/**
 * Validates a URL string
 */
export function validateURL(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'Must be a string' }]);
  }
  
  try {
    new URL(value);
    return value;
  } catch {
    throw new ValidationException([{ field: fieldName, message: 'Invalid URL format' }]);
  }
}

/**
 * Validates an enum value
 */
export function validateEnum<T extends string>(
  value: unknown, 
  fieldName: string, 
  allowedValues: T[]
): T {
  if (typeof value !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'Must be a string' }]);
  }
  
  if (!allowedValues.includes(value as T)) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `Must be one of: ${allowedValues.join(', ')}` 
    }]);
  }
  
  return value as T;
}

/**
 * Validates a string with length constraints
 */
export function validateString(
  value: unknown, 
  fieldName: string, 
  minLength = 0, 
  maxLength = 10000
): string {
  if (typeof value !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'Must be a string' }]);
  }
  
  if (value.length < minLength) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `Must be at least ${minLength} characters` 
    }]);
  }
  
  if (value.length > maxLength) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `Must be at most ${maxLength} characters` 
    }]);
  }
  
  return value;
}

/**
 * Validates a listing amount (allows £0 for free items)
 */
export function validateListingAmount(value: unknown, fieldName: string): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) {
    throw new ValidationException([{ field: fieldName, message: 'Must be a number' }]);
  }
  
  if (num < 0) {
    throw new ValidationException([{ field: fieldName, message: 'Must be at least £0' }]);
  }
  
  if (!isFinite(num)) {
    throw new ValidationException([{ field: fieldName, message: 'Must be a finite number' }]);
  }
  
  const MAX_AMOUNT = 100000;
  if (num > MAX_AMOUNT) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `Amount cannot exceed £${MAX_AMOUNT.toLocaleString()}` 
    }]);
  }
  
  // Validate reasonable precision (max 2 decimal places)
  const decimalPlaces = (num.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: 'Amount cannot have more than 2 decimal places' 
    }]);
  }
  
  return num;
}

/**
 * Validates an optional field
 */
export function validateOptional<T>(
  value: unknown,
  validator: (v: unknown) => T
): T | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return validator(value);
}
