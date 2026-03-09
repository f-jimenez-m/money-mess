import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionRepository } from '@repositories/transaction.repository';
import { AccountRepository } from '@repositories/account.repository';
import { BalanceInfo } from '@types';
import { AppError } from '@utils/errors';

/**
 * BalanceService
 *
 * Calcula el balance actual de una cuenta basado en transacciones pagadas.
 *
 * Balance = Sum(INCOME) - Sum(EXPENSE)
 *
 * Solo incluye transacciones con status = PAID
 */
export class BalanceService {
  private transactionRepo: TransactionRepository;
  private accountRepo: AccountRepository;

  constructor(private prisma: PrismaClient) {
    this.transactionRepo = new TransactionRepository(prisma);
    this.accountRepo = new AccountRepository(prisma);
  }

  /**
   * Obtiene el balance actual de una cuenta
   */
  async getAccountBalance(userId: string, accountId: string): Promise<BalanceInfo> {
    // Verificar que la cuenta existe y pertenece al usuario
    const account = await this.accountRepo.findByIdAndUserId(accountId, userId);
    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    // Sumar ingresos pagados
    const incomeSum = await this.transactionRepo.sumByAccountAndStatus(
      accountId,
      'PAID',
      'INCOME'
    );
    const totalIncome = new Decimal(incomeSum);

    // Sumar gastos pagados
    const expenseSum = await this.transactionRepo.sumByAccountAndStatus(
      accountId,
      'PAID',
      'EXPENSE'
    );
    const totalExpense = new Decimal(expenseSum);

    // Calcular balance: Income - Expense
    const currentBalance = totalIncome.minus(totalExpense);

    return {
      accountId: account.id,
      accountName: account.name,
      currency: account.currency,
      currentBalance,
      totalIncome,
      totalExpense,
    };
  }

  /**
   * Obtiene el balance de todas las cuentas del usuario
   */
  async getAllAccountsBalance(userId: string): Promise<BalanceInfo[]> {
    const accounts = await this.accountRepo.findManyByUserId(userId);

    if (accounts.length === 0) {
      return [];
    }

    const balances = await Promise.all(
      accounts.map((account) => this.getAccountBalance(userId, account.id))
    );

    return balances;
  }

  /**
   * Obtiene el balance total del usuario (suma todas las cuentas)
   */
  async getTotalBalance(userId: string): Promise<Decimal> {
    const balances = await this.getAllAccountsBalance(userId);

    return balances.reduce((total, balance) => total.plus(balance.currentBalance), new Decimal(0));
  }

  /**
   * Obtiene el saldo de una cuenta específica (solo el número)
   */
  async getBalance(userId: string, accountId: string): Promise<Decimal> {
    const balance = await this.getAccountBalance(userId, accountId);
    return balance.currentBalance;
  }

  /**
   * Get monthly summary for a specific month and year
   */
  async getMonthlySummary(
    userId: string,
    year: number,
    month: number
  ): Promise<{
    year: number;
    month: number;
    totalIncome: Decimal;
    totalExpenses: Decimal;
    netBalance: Decimal;
  }> {
    // Validate month
    if (month < 1 || month > 12) {
      throw new AppError(400, 'Invalid month', 'INVALID_MONTH');
    }

    // Get first and last day of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all paid transactions for this month
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        status: 'PAID',
        paidDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum.plus(new Decimal(t.amount)), new Decimal(0));

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum.plus(new Decimal(t.amount)), new Decimal(0));

    const netBalance = totalIncome.minus(totalExpenses);

    return {
      year,
      month,
      totalIncome,
      totalExpenses,
      netBalance,
    };
  }
}
