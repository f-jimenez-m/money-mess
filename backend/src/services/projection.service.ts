import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionRepository } from '@repositories/transaction.repository';
import { AccountRepository } from '@repositories/account.repository';
import { BalanceService } from '@services/balance.service';
import { ProjectedBalance } from '@types';
import { AppError } from '@utils/errors';

/**
 * ProjectionService
 *
 * Calcula proyecciones financieras futuras basadas en transacciones pendientes.
 *
 * Projected Balance = Current Balance + Future Income - Future Expenses
 *
 * Donde transacciones futuras son aquellas con:
 * - due_date > current_date
 * - status = PENDING
 */
export class ProjectionService {
  private transactionRepo: TransactionRepository;
  private accountRepo: AccountRepository;
  private balanceService: BalanceService;

  constructor(private prisma: PrismaClient) {
    this.transactionRepo = new TransactionRepository(prisma);
    this.accountRepo = new AccountRepository(prisma);
    this.balanceService = new BalanceService(prisma);
  }

  /**
   * Obtiene la proyección de balance para una cuenta específica
   */
  async getAccountProjection(
    userId: string,
    accountId: string,
    projectionDate: Date = new Date()
  ): Promise<ProjectedBalance> {
    // Verificar que la cuenta existe
    const account = await this.accountRepo.findByIdAndUserId(accountId, userId);
    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    // Obtener el balance actual
    const currentBalance = await this.balanceService.getBalance(userId, accountId);

    // Obtener transacciones pendientes futuras
    const futureTransactions = await this.transactionRepo.findMany({
      userId,
      accountId,
      status: 'PENDING',
      startDate: new Date(projectionDate),
    });

    // Calcular ingresos y gastos pendientes futuros
    let pendingIncome = new Decimal(0);
    let pendingExpense = new Decimal(0);

    for (const transaction of futureTransactions) {
      // Las transferencias no se cuentan en la proyección de forma normal
      // porque la entrada en una cuenta es compensada por la salida en otra
      // Sin embargo, se incluyen para dar visibilidad

      if (transaction.type === 'INCOME' || (transaction.type === 'TRANSFER' && transaction.accountId !== accountId)) {
        pendingIncome = pendingIncome.plus(transaction.amount);
      } else if (transaction.type === 'EXPENSE' || (transaction.type === 'TRANSFER' && transaction.accountId === accountId)) {
        pendingExpense = pendingExpense.plus(transaction.amount);
      }
    }

    // Calcular el balance proyectado
    const projectedBalance = currentBalance.plus(pendingIncome).minus(pendingExpense);

    return {
      accountId: account.id,
      accountName: account.name,
      currentBalance,
      projectedBalance,
      pendingIncome,
      pendingExpense,
      projectionDate,
    };
  }

  /**
   * Obtiene proyecciones para todas las cuentas del usuario
   */
  async getAllAccountsProjection(
    userId: string,
    projectionDate: Date = new Date()
  ): Promise<ProjectedBalance[]> {
    const accounts = await this.accountRepo.findManyByUserId(userId);

    if (accounts.length === 0) {
      return [];
    }

    const projections = await Promise.all(
      accounts.map((account) => this.getAccountProjection(userId, account.id, projectionDate))
    );

    return projections;
  }

  /**
   * Obtiene el balance total proyectado del usuario
   */
  async getTotalProjection(projectionDate: Date = new Date()): Promise<{
    userId: string;
    currentTotalBalance: Decimal;
    projectedTotalBalance: Decimal;
    totalPendingIncome: Decimal;
    totalPendingExpense: Decimal;
  }> {
    // Obtener todas las transacciones pendientes futuras para calcular totales globales
    const futureTransactions = await this.prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gt: projectionDate,
        },
      },
    });

    let totalPendingIncome = new Decimal(0);
    let totalPendingExpense = new Decimal(0);

    for (const transaction of futureTransactions) {
      if (transaction.type === 'INCOME') {
        totalPendingIncome = totalPendingIncome.plus(transaction.amount);
      } else if (transaction.type === 'EXPENSE') {
        totalPendingExpense = totalPendingExpense.plus(transaction.amount);
      }
    }

    // Este método requeriría userId, pero para una proyección total global
    // simplemente retornamos los datos de transacciones pendientes
    return {
      userId: 'global',
      currentTotalBalance: new Decimal(0),
      projectedTotalBalance: new Decimal(0),
      totalPendingIncome,
      totalPendingExpense,
    };
  }

  /**
   * Obtiene un resumen de proyección para un mes específico
   *
   * Retorna el balance al final del mes proyectado
   */
  async getMonthlyProjection(
    userId: string,
    accountId: string,
    year: number,
    month: number
  ): Promise<{
    month: string;
    startingBalance: Decimal;
    income: Decimal;
    expense: Decimal;
    endingBalance: Decimal;
  }> {
    // Verificar que la cuenta existe
    const account = await this.accountRepo.findByIdAndUserId(accountId, userId);
    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    // Primera y última fecha del mes
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Balance actual (antes del mes)
    const startingBalance = await this.balanceService.getBalance(userId, accountId);

    // Transacciones del mes (tanto pagadas como pendientes)
    const monthTransactions = await this.transactionRepo.findMany({
      userId,
      accountId,
      startDate,
      endDate,
    });

    let monthlyIncome = new Decimal(0);
    let monthlyExpense = new Decimal(0);

    for (const transaction of monthTransactions) {
      if (transaction.type === 'INCOME') {
        monthlyIncome = monthlyIncome.plus(transaction.amount);
      } else if (transaction.type === 'EXPENSE') {
        monthlyExpense = monthlyExpense.plus(transaction.amount);
      }
    }

    const endingBalance = startingBalance.plus(monthlyIncome).minus(monthlyExpense);

    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      startingBalance,
      income: monthlyIncome,
      expense: monthlyExpense,
      endingBalance,
    };
  }

  /**
   * Obtiene un timeline de proyección para los próximos N meses
   */
  async getProjectionTimeline(
    userId: string,
    accountId: string,
    monthsAhead: number = 12
  ): Promise<
    Array<{
      month: string;
      startingBalance: Decimal;
      income: Decimal;
      expense: Decimal;
      endingBalance: Decimal;
    }>
  > {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const timeline = [];

    for (let i = 0; i < monthsAhead; i++) {
      let year = currentYear;
      let month = currentMonth + i;

      if (month > 12) {
        year += Math.floor(month / 12);
        month = month % 12 || 12;
      }

      const projection = await this.getMonthlyProjection(userId, accountId, year, month);
      timeline.push(projection);
    }

    return timeline;
  }
}
