import { z } from 'zod';
import { Frequency } from '@prisma/client';

/**
 * Schema for creating a recurring rule
 */
export const CreateRecurringRuleSchema = z.object({
  name: z.string().min(1).max(255).describe('Recurring rule name'),
  accountId: z.string().uuid('Invalid account ID').describe('The account ID'),
  type: z.enum(['INCOME', 'EXPENSE'] as const).describe('Transaction type'),
  amount: z.number().positive('Amount must be greater than 0').describe('Transaction amount'),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).describe('Recurrence frequency'),
  startDate: z.coerce.date().describe('Start date for the recurring rule'),
  endDate: z.coerce.date().optional().nullable().describe('End date for the recurring rule (optional)'),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable().describe('The category ID (optional)'),
  description: z.string().max(500).optional().describe('Description (optional)'),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable().describe('Day of month (optional, for MONTHLY)'),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable().describe('Day of week (optional, for WEEKLY)'),
  installmentsTotal: z.number().int().positive().optional().nullable().describe('Total installments (optional)'),
});

export type CreateRecurringRuleInput = z.infer<typeof CreateRecurringRuleSchema>;

/**
 * Schema for updating a recurring rule
 */
export const UpdateRecurringRuleSchema = CreateRecurringRuleSchema.partial();

export type UpdateRecurringRuleInput = z.infer<typeof UpdateRecurringRuleSchema>;
