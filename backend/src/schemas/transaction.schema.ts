import { z } from 'zod';
import { TransactionType } from '@prisma/client';

/**
 * Schema for creating a new transaction (income or expense)
 */
export const CreateTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID').describe('The account ID'),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable().describe('The category ID (optional)'),
  type: z.enum(['INCOME', 'EXPENSE'] as const).describe('Transaction type'),
  amount: z.number().positive('Amount must be greater than 0').describe('Transaction amount'),
  description: z.string().min(1).max(500).describe('Transaction description'),
  dueDate: z.coerce.date().describe('Due date for the transaction'),
  recurringRuleId: z.string().uuid('Invalid recurring rule ID').optional().nullable().describe('Recurring rule ID (optional)'),
  installmentNumber: z.number().int().positive().optional().nullable().describe('Installment number (optional)'),
  installmentTotal: z.number().int().positive().optional().nullable().describe('Total installments (optional)'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

/**
 * Schema for creating a transfer between two accounts
 */
export const CreateTransferSchema = z.object({
  fromAccountId: z.string().uuid('Invalid source account ID').describe('Source account ID'),
  toAccountId: z.string().uuid('Invalid destination account ID').describe('Destination account ID'),
  amount: z.number().positive('Amount must be greater than 0').describe('Transfer amount'),
  description: z.string().max(500).optional().describe('Transfer description (optional)'),
  dueDate: z.coerce.date().describe('Due date for the transfer'),
});

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>;

/**
 * Schema for updating a transaction status
 */
export const UpdateTransactionStatusSchema = z.object({
  paidDate: z.coerce.date().optional().describe('Date when the transaction was paid (optional)'),
});

export type UpdateTransactionStatusInput = z.infer<typeof UpdateTransactionStatusSchema>;
