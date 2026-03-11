import { PrismaClient, Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { TransactionRepository } from '@repositories/transaction.repository';
import { AccountRepository } from '@repositories/account.repository';
import { CreateTransactionDTO, CreateTransferDTO, TransactionResponse } from '@types';
import { AppError, ValidationError } from '@utils/errors';

/**
 * TransactionService
 *
 * Maneja la creación, actualización y eliminación de transacciones.
 *
 * Características:
 * - Crear transacciones (income/expense)
 * - Crear transferencias entre cuentas (genera 2 transacciones)
 * - Marcar transacciones como pagadas
 * - Validaciones de integridad
 */
export class TransactionService {
  private transactionRepo: TransactionRepository;
  private accountRepo: AccountRepository;

  constructor(private prisma: PrismaClient) {
    this.transactionRepo = new TransactionRepository(prisma);
    this.accountRepo = new AccountRepository(prisma);
  }

  /**
   * Crea una transacción simple (income o expense)
   */
  async createTransaction(
    userId: string,
    dto: CreateTransactionDTO
  ): Promise<TransactionResponse> {
    // Validar que la cuenta existe y pertenece al usuario
    const account = await this.accountRepo.findByIdAndUserId(dto.accountId, userId);
    if (!account) {
      throw new AppError(404, 'Account not found', 'ACCOUNT_NOT_FOUND');
    }

    // Las transferencias no se crean directamente aquí
    if (dto.type === 'TRANSFER') {
      throw new ValidationError('Use createTransfer method for transfers', {
        type: 'Transfers must be created with createTransfer method',
      });
    }

    // Validar que type sea INCOME o EXPENSE
    if (!['INCOME', 'EXPENSE'].includes(dto.type)) {
      throw new ValidationError('Invalid transaction type', {
        type: `Type must be INCOME or EXPENSE, got ${dto.type}`,
      });
    }

    // Validar que el monto sea positivo
    const amount = new Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new ValidationError('Invalid amount', {
        amount: 'Amount must be greater than 0',
      });
    }

    // Validar que la fecha sea válida, salvo que el cliente solicite permitir fechas pasadas
    if (new Date(dto.dueDate) < new Date()) {
      if (!dto.allowPastDate) {
        const now = new Date();
        if (now.toDateString() !== new Date(dto.dueDate).toDateString()) {
          throw new ValidationError('Invalid due date', {
            dueDate: 'Due date cannot be in the past (unless today)',
          });
        }
      }
    }

    // Crear la transacción
    const transaction = await this.transactionRepo.create({
      userId,
      accountId: dto.accountId,
      categoryId: dto.categoryId || null,
      type: dto.type as any,
      amount,
      description: dto.description,
      dueDate: new Date(dto.dueDate),
      status: 'PENDING',
      paidDate: null,
      recurringRuleId: dto.recurringRuleId || null,
      installmentNumber: dto.installmentNumber || null,
      installmentTotal: dto.installmentTotal || null,
      transferGroupId: null,
      relatedTransactionId: null,
    });

    return this.mapToResponse(transaction);
  }

  /**
   * Crea una transferencia entre dos cuentas
   *
   * Genera dos transacciones:
   * 1. EXPENSE en la cuenta origen
   * 2. INCOME en la cuenta destino
   *
   * Ambas comparten el mismo transfer_group_id
   */
  async createTransfer(userId: string, dto: CreateTransferDTO): Promise<{
    sourceTransaction: TransactionResponse;
    destinationTransaction: TransactionResponse;
  }> {
    // Validar que las cuentas existan
    const fromAccount = await this.accountRepo.findByIdAndUserId(dto.fromAccountId, userId);
    if (!fromAccount) {
      throw new AppError(404, 'Source account not found', 'ACCOUNT_NOT_FOUND');
    }

    const toAccount = await this.accountRepo.findByIdAndUserId(dto.toAccountId, userId);
    if (!toAccount) {
      throw new AppError(404, 'Destination account not found', 'ACCOUNT_NOT_FOUND');
    }

    // No permitir transferencias a la misma cuenta
    if (dto.fromAccountId === dto.toAccountId) {
      throw new ValidationError('Invalid transfer', {
        accounts: 'Cannot transfer to the same account',
      });
    }

    const amount = new Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new ValidationError('Invalid amount', {
        amount: 'Amount must be greater than 0',
      });
    }

    const transferGroupId = uuidv4();
    const dueDate = new Date(dto.dueDate);

    // Crear transacción de salida (EXPENSE) en cuenta origen
    const sourceTransaction = await this.transactionRepo.create({
      userId,
      accountId: dto.fromAccountId,
      categoryId: null,
      type: 'TRANSFER' as any,
      amount,
      description: dto.description || `Transfer to ${toAccount.name}`,
      dueDate,
      status: 'PENDING',
      paidDate: null,
      transferGroupId,
      relatedTransactionId: null,
      recurringRuleId: null,
      installmentNumber: null,
      installmentTotal: null,
    });

    // Crear transacción de entrada (INCOME) en cuenta destino
    const destinationTransaction = await this.transactionRepo.create({
      userId,
      accountId: dto.toAccountId,
      categoryId: null,
      type: 'TRANSFER' as any,
      amount,
      description: dto.description || `Transfer from ${fromAccount.name}`,
      dueDate,
      status: 'PENDING',
      paidDate: null,
      transferGroupId,
      relatedTransactionId: sourceTransaction.id,
      recurringRuleId: null,
      installmentNumber: null,
      installmentTotal: null,
    });

    // Actualizar la referencia bidireccional en la transacción de salida
    await this.transactionRepo.update(sourceTransaction.id, {
      relatedTransactionId: destinationTransaction.id,
    });

    return {
      sourceTransaction: this.mapToResponse(sourceTransaction),
      destinationTransaction: this.mapToResponse(destinationTransaction),
    };
  }

  /**
   * Marca una transacción como pagada
   */
  async markTransactionAsPaid(userId: string, transactionId: string): Promise<TransactionResponse> {
    // Verificar que la transacción existe y pertenece al usuario
    const transaction = await this.transactionRepo.findByIdAndUserId(transactionId, userId);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Si es una transferencia, también marcar la transacción relacionada
    if (transaction.type === 'TRANSFER' && transaction.relatedTransactionId) {
      await this.transactionRepo.update(transaction.relatedTransactionId, {
        paidDate: new Date(),
        status: 'PAID',
      });
    }

    // Actualizar la transacción
    const updated = await this.transactionRepo.update(transactionId, {
      paidDate: new Date(),
      status: 'PAID',
    });

    return this.mapToResponse(updated);
  }

  /**
   * Marca una transacción como pendiente
   */
  async markTransactionAsPending(userId: string, transactionId: string): Promise<TransactionResponse> {
    // Verificar que la transacción existe y pertenece al usuario
    const transaction = await this.transactionRepo.findByIdAndUserId(transactionId, userId);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Si es una transferencia, también marcar la transacción relacionada
    if (transaction.type === 'TRANSFER' && transaction.relatedTransactionId) {
      await this.transactionRepo.update(transaction.relatedTransactionId, {
        paidDate: null,
        status: 'PENDING',
      });
    }

    // Actualizar la transacción
    const updated = await this.transactionRepo.update(transactionId, {
      paidDate: null,
      status: 'PENDING',
    });

    return this.mapToResponse(updated);
  }

  /**
   * Obtiene una transacción por ID
   */
  async getTransaction(userId: string, transactionId: string): Promise<TransactionResponse> {
    const transaction = await this.transactionRepo.findByIdAndUserId(transactionId, userId);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }
    return this.mapToResponse(transaction);
  }

  /**
   * Get paginated transactions with optional filters
   */
  async getTransactions(
    userId: string,
    filters: {
      accountId?: string;
      categoryId?: string;
      type?: 'INCOME' | 'EXPENSE';
      status?: 'PENDING' | 'PAID' | 'CANCELLED';
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    data: TransactionResponse[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    // Build filter
    const where: any = { userId };
    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    if (filters.dateFrom || filters.dateTo) {
      where.dueDate = {};
      if (filters.dateFrom) where.dueDate.gte = filters.dateFrom;
      if (filters.dateTo) where.dueDate.lte = filters.dateTo;
    }

    // Get total count
    const total = await this.prisma.transaction.count({ where });

    // Get paginated data
    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      skip: offset,
      take: limit,
    });

    return {
      data: transactions.map((t) => this.mapToResponse(t)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Elimina una transacción (y su par si es transferencia)
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.transactionRepo.findByIdAndUserId(transactionId, userId);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Si es una transferencia, eliminar la transacción relacionada primero
    if (transaction.relatedTransactionId) {
      await this.transactionRepo.delete(transaction.relatedTransactionId);
    }

    await this.transactionRepo.delete(transactionId);
  }

  /**
   * Mapea una transacción de Prisma a la respuesta de API
   */
  private mapToResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      userId: transaction.userId,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId || undefined,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      dueDate: transaction.dueDate,
      paidDate: transaction.paidDate || undefined,
      status: transaction.status,
      installmentNumber: transaction.installmentNumber || undefined,
      installmentTotal: transaction.installmentTotal || undefined,
      transferGroupId: transaction.transferGroupId || undefined,
      recurringRuleId: transaction.recurringRuleId || undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
