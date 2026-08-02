import { z } from 'zod';

export const objectIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');
