import { PrismaClient, Frequency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RecurringRuleRepository } from '@repositories/recurring.repository';
import { TransactionRepository } from '@repositories/transaction.repository';
import { CreateRecurringRuleDTO, RecurringRuleResponse, GeneratedTransaction } from '@types';
import { AppError, ValidationError } from '@utils/errors';

/**
 * RecurringService
 *
 * Gestiona reglas de recurrencia y genera transacciones futuras.
 *
 * Soporta:
 * - Frecuencias: WEEKLY, MONTHLY, YEARLY
 * - Cuotas: installmentsTotal para créditos en cuotas
 * - Generación automática de transacciones
 */
export class RecurringService {
  private recurringRepo: RecurringRuleRepository;
  private transactionRepo: TransactionRepository;

  constructor(private prisma: PrismaClient) {
    this.recurringRepo = new RecurringRuleRepository(prisma);
    this.transactionRepo = new TransactionRepository(prisma);
  }

  /**
   * Crea una nueva regla de recurrencia
   */
  async createRecurringRule(
    userId: string,
    dto: CreateRecurringRuleDTO
  ): Promise<RecurringRuleResponse> {
    // Validar que el monto sea positivo
    const amount = new Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new ValidationError('Invalid amount', {
        amount: 'Amount must be greater than 0',
      });
    }

    // Validar que startDate sea válida
    const startDate = new Date(dto.startDate);
    if (startDate < new Date()) {
      throw new ValidationError('Invalid start date', {
        startDate: 'Start date cannot be in the past',
      });
    }

    // Validar que endDate sea posterior a startDate si está especificada
    if (dto.endDate) {
      const endDate = new Date(dto.endDate);
      if (endDate < startDate) {
        throw new ValidationError('Invalid end date', {
          endDate: 'End date must be after start date',
        });
      }
    }

    // Validar dayOfMonth para frecuencia monthly
    if (dto.frequency === 'MONTHLY' && dto.dayOfMonth) {
      if (dto.dayOfMonth < 1 || dto.dayOfMonth > 31) {
        throw new ValidationError('Invalid day of month', {
          dayOfMonth: 'Day of month must be between 1 and 31',
        });
      }
    }

    // Crear la regla
    const rule = await this.recurringRepo.create({
      userId,
      name: dto.name,
      type: dto.type as any,
      amount,
      frequency: dto.frequency as Frequency,
      startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      dayOfMonth: dto.dayOfMonth || null,
      accountId: dto.accountId,
      categoryId: dto.categoryId || null,
      installmentsTotal: dto.installmentsTotal || null,
    });

    return this.mapToResponse(rule);
  }

  /**
   * Genera transacciones futuras basadas en una regla de recurrencia
   *
   * Soporta:
   * - WEEKLY: cada semana
   * - MONTHLY: cada mes (en el dayOfMonth especificado)
   * - YEARLY: cada año
   * - Cuotas: si installmentsTotal está especificado, genera N transacciones
   */
  async generateRecurringTransactions(
    recurringRuleId: string,
    upToDate: Date,
    maxCount?: number
  ): Promise<GeneratedTransaction[]> {
    const rule = await this.recurringRepo.findById(recurringRuleId);
    if (!rule) {
      throw new AppError(404, 'Recurring rule not found', 'RECURRING_RULE_NOT_FOUND');
    }

    // Contar cuántas transacciones ya existen para esta regla
    const existingCount = await this.transactionRepo.countRecurringTransactions(recurringRuleId);

    const transactions: GeneratedTransaction[] = [];
    let currentDate = new Date(rule.startDate);
    let installmentNumber = 1;
    let generatedCount = 0;

    while (currentDate <= upToDate) {
      // Si tiene límite de cuotas y ya las alcanzamos, salir
      if (rule.installmentsTotal && installmentNumber > rule.installmentsTotal) {
        break;
      }

      // Si tiene fecha de fin y la pasamos, salir
      if (rule.endDate && currentDate > rule.endDate) {
        break;
      }

      // Si ya existe una transacción para esta fecha, saltar
      if (existingCount + generatedCount > 0 && installmentNumber <= existingCount) {
        installmentNumber++;
        currentDate = this.getNextOccurrence(currentDate, rule.frequency);
        continue;
      }

      // Limitar la cantidad de transacciones a generar en una sola ejecución
      const limit = maxCount || 1000;
      if (generatedCount >= limit) {
        break;
      }

      // Crear la transacción
      transactions.push({
        userId: rule.userId,
        accountId: rule.accountId,
        categoryId: rule.categoryId || undefined,
        type: rule.type as 'INCOME' | 'EXPENSE',
        amount: rule.amount,
        description: rule.name,
        dueDate: currentDate,
        recurringRuleId: recurringRuleId,
        installmentNumber: rule.installmentsTotal ? installmentNumber : undefined,
        installmentTotal: rule.installmentsTotal || undefined,
      });

      generatedCount++;
      installmentNumber++;
      currentDate = this.getNextOccurrence(currentDate, rule.frequency);
    }

    return transactions;
  }

  /**
   * Ejecuta la generación de transacciones recurrentes para todas las reglas activas
   *
   * Genera transacciones para todos los usuarios hasta la fecha especificada
   */
  async executeRecurringGeneration(upToDate: Date = new Date()): Promise<{
    totalGenerated: number;
    byRule: Record<string, number>;
  }> {
    // Obtener todas las reglas activas
    const activeRules = await this.prisma.recurringRule.findMany({
      where: {
        startDate: { lte: upToDate },
        OR: [{ endDate: null }, { endDate: { gte: upToDate } }],
      },
    });

    let totalGenerated = 0;
    const byRule: Record<string, number> = {};

    for (const rule of activeRules) {
      try {
        const generated = await this.generateRecurringTransactions(rule.id, upToDate);

        if (generated.length > 0) {
          // Crear las transacciones en la base de datos
          await Promise.all(
            generated.map((transaction) =>
              this.transactionRepo.create({
                userId: rule.userId,
                accountId: transaction.accountId,
                categoryId: transaction.categoryId || null,
                type: transaction.type as any,
                amount: transaction.amount,
                description: transaction.description,
                dueDate: transaction.dueDate,
                status: 'PENDING',
                paidDate: null,
                recurringRuleId: transaction.recurringRuleId || null,
                installmentNumber: transaction.installmentNumber || null,
                installmentTotal: transaction.installmentTotal || null,
                transferGroupId: null,
                relatedTransactionId: null,
              })
            )
          );

          totalGenerated += generated.length;
          byRule[rule.id] = generated.length;
        }
      } catch (error) {
        console.error(`Error generating transactions for rule ${rule.id}:`, error);
      }
    }

    return {
      totalGenerated,
      byRule,
    };
  }

  /**
   * Obtiene todas las reglas de recurrencia de un usuario
   */
  async getRecurringRules(userId: string): Promise<RecurringRuleResponse[]> {
    const rules = await this.recurringRepo.findManyByUserId(userId);
    return rules.map((rule) => this.mapToResponse(rule));
  }

  /**
   * Obtiene una regla de recurrencia por ID
   */
  async getRecurringRule(userId: string, ruleId: string): Promise<RecurringRuleResponse> {
    const rule = await this.recurringRepo.findByIdAndUserId(ruleId, userId);
    if (!rule) {
      throw new AppError(404, 'Recurring rule not found', 'RECURRING_RULE_NOT_FOUND');
    }
    return this.mapToResponse(rule);
  }

  /**
   * Elimina una regla de recurrencia
   */
  async deleteRecurringRule(userId: string, ruleId: string): Promise<void> {
    const rule = await this.recurringRepo.findByIdAndUserId(ruleId, userId);
    if (!rule) {
      throw new AppError(404, 'Recurring rule not found', 'RECURRING_RULE_NOT_FOUND');
    }

    await this.recurringRepo.delete(ruleId);
  }

  /**
   * Actualiza una regla de recurrencia
   */
  async updateRecurringRule(userId: string, ruleId: string, dto: Partial<CreateRecurringRuleDTO>): Promise<RecurringRuleResponse> {
    const existing = await this.recurringRepo.findByIdAndUserId(ruleId, userId);
    if (!existing) {
      throw new AppError(404, 'Recurring rule not found', 'RECURRING_RULE_NOT_FOUND');
    }

    // Validaciones similares a create
    if (dto.amount !== undefined) {
      const amount = new Decimal(dto.amount as any);
      if (amount.lte(0)) {
        throw new ValidationError('Invalid amount', { amount: 'Amount must be greater than 0' });
      }
    }

    if (dto.startDate) {
      const startDate = new Date(dto.startDate as any);
      if (startDate < new Date()) {
        throw new ValidationError('Invalid start date', { startDate: 'Start date cannot be in the past' });
      }
    }

    if (dto.endDate && dto.startDate) {
      const startDate = new Date(dto.startDate as any);
      const endDate = new Date(dto.endDate as any);
      if (endDate < startDate) {
        throw new ValidationError('Invalid end date', { endDate: 'End date must be after start date' });
      }
    }

    if (dto.frequency === 'MONTHLY' && dto.dayOfMonth !== undefined) {
      if ((dto.dayOfMonth as number) < 1 || (dto.dayOfMonth as number) > 31) {
        throw new ValidationError('Invalid day of month', { dayOfMonth: 'Day of month must be between 1 and 31' });
      }
    }

    const updated = await this.recurringRepo.update(ruleId, {
      name: dto.name as any,
      type: dto.type as any,
      amount: dto.amount as any,
      frequency: dto.frequency as any,
      startDate: dto.startDate ? new Date(dto.startDate as any) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate as any) : undefined,
      dayOfMonth: dto.dayOfMonth as any,
      accountId: dto.accountId as any,
      categoryId: dto.categoryId as any,
      installmentsTotal: dto.installmentsTotal as any,
    })

    return this.mapToResponse(updated)
  }

  /**
   * Calcula la siguiente ocurrencia de una fecha según la frecuencia
   */
  private getNextOccurrence(date: Date, frequency: Frequency): Date {
    const next = new Date(date);

    switch (frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;

      case 'MONTHLY':
        // Ir al próximo mes y mantener el mismo día
        next.setMonth(next.getMonth() + 1);
        break;

      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;

      default:
        throw new Error(`Unknown frequency: ${frequency}`);
    }

    return next;
  }

  /**
   * Mapea una regla de Prisma a la respuesta de API
   */
  private mapToResponse(rule: any): RecurringRuleResponse {
    return {
      id: rule.id,
      userId: rule.userId,
      name: rule.name,
      type: rule.type,
      amount: rule.amount,
      frequency: rule.frequency,
      startDate: rule.startDate,
      endDate: rule.endDate || undefined,
      dayOfMonth: rule.dayOfMonth || undefined,
      accountId: rule.accountId,
      categoryId: rule.categoryId || undefined,
      installmentsTotal: rule.installmentsTotal || undefined,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}
