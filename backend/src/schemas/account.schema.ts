import { z } from 'zod';

/**
 * Schema for creating an account
 */
export const CreateAccountSchema = z.object({
  name: z.string().min(1).max(255).describe('Account name'),
  type: z.enum(['CASH', 'BANK', 'CREDIT', 'SAVINGS'] as const).describe('Account type'),
  currency: z.string().length(3).default('USD').describe('Currency code (ISO 4217)'),
  initialBalance: z.number().default(0).describe('Initial balance (optional, default 0)'),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;

/**
 * Schema for updating an account
 */
export const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Account name'),
  type: z.enum(['CASH', 'BANK', 'CREDIT', 'SAVINGS'] as const).optional().describe('Account type'),
  currency: z.string().length(3).optional().describe('Currency code (ISO 4217)'),
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
