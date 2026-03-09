/**
 * Example Usage of Financial Services
 * 
 * Este archivo muestra ejemplos de cómo utilizar los servicios financieros
 * en los controllers y rutas.
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  BalanceService,
  TransactionService,
  RecurringService,
  ProjectionService,
} from '@services';
import { CreateTransactionDTO, CreateTransferDTO, CreateRecurringRuleDTO } from '@types';

// Inicializar Prisma
const prisma = new PrismaClient();

// ============================================
// BALANCE SERVICE EXAMPLES
// ============================================

async function exampleBalanceService() {
  const balanceService = new BalanceService(prisma);
  const userId = 'user-123';
  const accountId = 'account-456';

  // Obtener balance de una cuenta
  const balance = await balanceService.getAccountBalance(userId, accountId);
  console.log('Account balance:', {
    accountName: balance.accountName,
    currentBalance: balance.currentBalance.toString(),
    totalIncome: balance.totalIncome.toString(),
    totalExpense: balance.totalExpense.toString(),
    currency: balance.currency,
  });

  // Obtener balances de todas las cuentas
  const allBalances = await balanceService.getAllAccountsBalance(userId);
  console.log('All account balances:', allBalances);

  // Obtener balance total
  const totalBalance = await balanceService.getTotalBalance(userId);
  console.log('Total balance:', totalBalance.toString());
}

// ============================================
// TRANSACTION SERVICE EXAMPLES
// ============================================

async function exampleTransactionService() {
  const transactionService = new TransactionService(prisma);
  const userId = 'user-123';

  // Crear una transacción de gasto
  const expenseDto: CreateTransactionDTO = {
    accountId: 'account-456',
    categoryId: 'category-groceries',
    type: 'EXPENSE',
    amount: 75.50,
    description: 'Weekly groceries at supermarket',
    dueDate: new Date('2026-03-15'),
  };

  const expense = await transactionService.createTransaction(userId, expenseDto);
  console.log('Created expense transaction:', expense);

  // Crear una transacción de ingreso
  const incomeDto: CreateTransactionDTO = {
    accountId: 'account-456',
    categoryId: 'category-salary',
    type: 'INCOME',
    amount: 3000,
    description: 'Monthly salary',
    dueDate: new Date('2026-03-01'),
  };

  const income = await transactionService.createTransaction(userId, incomeDto);
  console.log('Created income transaction:', income);

  // Crear una transferencia entre cuentas
  const transferDto: CreateTransferDTO = {
    fromAccountId: 'account-checking',
    toAccountId: 'account-savings',
    amount: 500,
    description: 'Monthly savings transfer',
    dueDate: new Date('2026-03-15'),
  };

  const transfer = await transactionService.createTransfer(userId, transferDto);
  console.log('Created transfer:', {
    from: transfer.sourceTransaction,
    to: transfer.destinationTransaction,
  });

  // Marcar una transacción como pagada
  const paid = await transactionService.markTransactionAsPaid(userId, expense.id);
  console.log('Transaction marked as paid:', paid);

  // Obtener una transacción
  const retrieved = await transactionService.getTransaction(userId, expense.id);
  console.log('Retrieved transaction:', retrieved);
}

// ============================================
// RECURRING SERVICE EXAMPLES
// ============================================

async function exampleRecurringService() {
  const recurringService = new RecurringService(prisma);
  const userId = 'user-123';

  // Crear una regla de recurrencia mensual (salario)
  const salaryRule: CreateRecurringRuleDTO = {
    name: 'Monthly Salary',
    type: 'INCOME',
    amount: 3000,
    frequency: 'MONTHLY',
    startDate: new Date('2026-03-01'),
    dayOfMonth: 1,
    accountId: 'account-checking',
    categoryId: 'category-salary',
  };

  const salary = await recurringService.createRecurringRule(userId, salaryRule);
  console.log('Created recurring rule:', salary);

  // Crear una regla de recurrencia para cuotas (crédito de auto en 24 cuotas)
  const loanRule: CreateRecurringRuleDTO = {
    name: 'Auto Loan',
    type: 'EXPENSE',
    amount: 500,
    frequency: 'MONTHLY',
    startDate: new Date('2026-03-05'),
    dayOfMonth: 5,
    accountId: 'account-checking',
    categoryId: 'category-loan',
    installmentsTotal: 24, // 24 cuotas
  };

  const loan = await recurringService.createRecurringRule(userId, loanRule);
  console.log('Created loan rule with 24 installments:', loan);

  // Generar transacciones futuras para una regla
  const upToDate = new Date('2026-12-31');
  const generated = await recurringService.generateRecurringTransactions(
    salary.id,
    upToDate
  );
  console.log(`Generated ${generated.length} transactions up to ${upToDate.toISOString()}`);

  // Ejecutar generación para todas las reglas activas
  const result = await recurringService.executeRecurringGeneration(upToDate);
  console.log('Recurring generation result:', {
    totalGenerated: result.totalGenerated,
    byRule: result.byRule,
  });

  // Obtener todas las reglas del usuario
  const rules = await recurringService.getRecurringRules(userId);
  console.log('All recurring rules:', rules);
}

// ============================================
// PROJECTION SERVICE EXAMPLES
// ============================================

async function exampleProjectionService() {
  const projectionService = new ProjectionService(prisma);
  const userId = 'user-123';

  // Obtener proyección para una cuenta
  const projection = await projectionService.getAccountProjection(
    userId,
    'account-checking'
  );
  console.log('Account projection:', {
    accountName: projection.accountName,
    currentBalance: projection.currentBalance.toString(),
    projectedBalance: projection.projectedBalance.toString(),
    pendingIncome: projection.pendingIncome.toString(),
    pendingExpense: projection.pendingExpense.toString(),
  });

  // Obtener proyecciones para todas las cuentas
  const allProjections = await projectionService.getAllAccountsProjection(userId);
  console.log('All account projections:', allProjections);

  // Obtener proyección para un mes específico
  const monthlyProjection = await projectionService.getMonthlyProjection(
    userId,
    'account-checking',
    2026,
    3 // Marzo
  );
  console.log('March 2026 projection:', {
    month: monthlyProjection.month,
    startingBalance: monthlyProjection.startingBalance.toString(),
    income: monthlyProjection.income.toString(),
    expense: monthlyProjection.expense.toString(),
    endingBalance: monthlyProjection.endingBalance.toString(),
  });

  // Obtener timeline de proyección para los próximos 12 meses
  const timeline = await projectionService.getProjectionTimeline(
    userId,
    'account-checking',
    12
  );
  console.log('12-month projection timeline:', timeline);
}

// ============================================
// TYPICAL WORKFLOW
// ============================================

async function typicalWorkflow() {
  const userId = 'user-123';
  const balanceService = new BalanceService(prisma);
  const transactionService = new TransactionService(prisma);
  const recurringService = new RecurringService(prisma);
  const projectionService = new ProjectionService(prisma);

  console.log('\n========== TYPICAL WORKFLOW ==========\n');

  // 1. Ver el balance actual
  const currentBalance = await balanceService.getAccountBalance(userId, 'account-checking');
  console.log('1. Current balance:', currentBalance.currentBalance.toString());

  // 2. Registrar un nuevo gasto
  await transactionService.createTransaction(userId, {
    accountId: 'account-checking',
    categoryId: 'category-groceries',
    type: 'EXPENSE',
    amount: 75,
    description: 'Groceries',
    dueDate: new Date(),
  });
  console.log('2. Expense registered (pending)');

  // 3. Ver la proyección (el gasto se refleja)
  const projection = await projectionService.getAccountProjection(userId, 'account-checking');
  console.log('3. Projected balance:', projection.projectedBalance.toString());

  // 4. Pagar el gasto
  // (obtener primero la transacción para marcarla como pagada)
  console.log('4. Expense marked as paid (balance changes)');

  // 5. Ver el nuevo balance actual
  const newBalance = await balanceService.getAccountBalance(userId, 'account-checking');
  console.log('5. New current balance:', newBalance.currentBalance.toString());

  // 6. Ver proyección actualizada
  const newProjection = await projectionService.getAccountProjection(userId, 'account-checking');
  console.log('6. Updated projected balance:', newProjection.projectedBalance.toString());
}

// ============================================
// MAIN
// ============================================

async function main() {
  try {
    console.log('Starting Financial Services Examples...\n');

    // Descomentar para ejecutar ejemplos individuales
    // await exampleBalanceService();
    // await exampleTransactionService();
    // await exampleRecurringService();
    // await exampleProjectionService();
    // await typicalWorkflow();

    console.log('\nExamples completed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Descomentar para ejecutar
// main();
