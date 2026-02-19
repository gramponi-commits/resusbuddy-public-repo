// Zod schema validation for weight inputs to prevent edge cases
import { z } from 'zod';

// Weight validation schema with proper bounds and type checking
export const weightSchema = z.number({
  required_error: 'Weight is required',
  invalid_type_error: 'Weight must be a number',
})
  .positive('Weight must be positive')
  .min(0.5, 'Weight must be at least 0.5 kg')
  .max(150, 'Weight must not exceed 150 kg')
  .finite('Weight must be a valid finite number');

export interface WeightValidationSuccess {
  success: true;
  weight: number;
}

export interface WeightValidationError {
  success: false;
  error: string;
}

export type WeightValidationResult = WeightValidationSuccess | WeightValidationError;

// Parse and validate weight from string input
export function parseWeight(input: string): WeightValidationResult {
  // Reject scientific notation patterns
  if (/[eE]/.test(input)) {
    return { success: false, error: 'Scientific notation is not allowed' };
  }
  
  const parsed = parseFloat(input);
  
  // Check for special values before zod validation
  if (!Number.isFinite(parsed)) {
    return { success: false, error: 'Weight must be a valid finite number' };
  }
  
  const result = weightSchema.safeParse(parsed);
  
  if (result.success) {
    return { success: true, weight: result.data };
  }
  
  // Extract first error message
  const firstError = result.error.errors[0]?.message ?? 'Invalid weight value';
  return { success: false, error: firstError };
}

// Validate weight for dosing calculations (used in dosing functions)
export function validateWeightForDosing(weight: number | null | undefined): number | null {
  if (weight === null || weight === undefined) {
    return null;
  }
  
  const result = weightSchema.safeParse(weight);
  return result.success ? result.data : null;
}

// Check if a string input would result in a valid weight
export function isValidWeightInput(input: string): boolean {
  if (!input.trim()) return false;
  const result = parseWeight(input);
  return result.success;
}
