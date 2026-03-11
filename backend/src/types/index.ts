import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// TRANSACTION TYPES
// ============================================

export interface CreateTransactionDTO {
  accountId: string;
  categoryId?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: Decimal | number;
  description: string;
  dueDate: Date;
  /**
   * Si es true, permite enviar transacciones con fecha pasada.
   * Usado por la UI para importar movimientos históricos.
   */
  allowPastDate?: boolean;
  recurringRuleId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
}

export interface CreateTransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: Decimal | number;
  description?: string;
  dueDate: Date;
  allowPastDate?: boolean;
  categoryId?: string;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  type: string;
  amount: Decimal;
  description: string;
  dueDate: Date;
  paidDate?: Date;
  status: string;
  installmentNumber?: number;
  installmentTotal?: number;
  transferGroupId?: string;
  recurringRuleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// BALANCE TYPES
// ============================================

export interface BalanceInfo {
  accountId: string;
  accountName: string;
  currency: string;
  currentBalance: Decimal;
  totalIncome: Decimal;
  totalExpense: Decimal;
}

// ============================================
// PROJECTION TYPES
// ============================================

export interface ProjectedBalance {
  accountId: string;
  accountName: string;
  currentBalance: Decimal;
  projectedBalance: Decimal;
  pendingIncome: Decimal;
  pendingExpense: Decimal;
  projectionDate: Date;
}

// ============================================
// RECURRING RULE TYPES
// ============================================

export interface CreateRecurringRuleDTO {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  amount: Decimal | number;
  frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
  dayOfMonth?: number;
  accountId: string;
  categoryId?: string;
  installmentsTotal?: number;
}

export interface RecurringRuleResponse {
  id: string;
  userId: string;
  name: string;
  type: string;
  amount: Decimal;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  dayOfMonth?: number;
  accountId: string;
  categoryId?: string;
  installmentsTotal?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// QUERY OPTIONS
// ============================================

export interface TransactionQueryOptions {
  accountId?: string;
  categoryId?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  includeRelated?: boolean;
}

// ============================================
// RECURRING ENGINE TYPES
// ============================================

export interface GeneratedTransaction {
  userId?: string;
  accountId: string;
  categoryId?: string;
  type: 'INCOME' | 'EXPENSE';
  amount: Decimal;
  description: string;
  dueDate: Date;
  recurringRuleId: string;
  installmentNumber?: number;
  installmentTotal?: number;
}
