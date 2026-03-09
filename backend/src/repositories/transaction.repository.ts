import { PrismaClient, Transaction, TransactionStatus, TransactionType } from '@prisma/client';

export interface TransactionFilter {
  userId: string;
  accountId?: string;
  categoryId?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}

export class TransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: { id, userId },
    });
  }

  async findByTransferGroupId(transferGroupId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { transferGroupId },
    });
  }

  async findMany(filter: TransactionFilter): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId: filter.userId,
        accountId: filter.accountId,
        categoryId: filter.categoryId,
        status: filter.status,
        type: filter.type,
        dueDate: {
          gte: filter.startDate,
          lte: filter.endDate,
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });
  }

  async findByAccountAndStatus(
    userId: string,
    accountId: string,
    status: TransactionStatus
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        accountId,
        status,
      },
    });
  }

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & {
      paidDate?: Date | null;
      categoryId?: string | null;
      recurringRuleId?: string | null;
      installmentNumber?: number | null;
      installmentTotal?: number | null;
      transferGroupId?: string | null;
      relatedTransactionId?: string | null;
    }
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        userId: data.userId,
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        type: data.type,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        status: data.status,
        paidDate: data.paidDate || null,
        recurringRuleId: data.recurringRuleId || null,
        installmentNumber: data.installmentNumber || null,
        installmentTotal: data.installmentTotal || null,
        transferGroupId: data.transferGroupId || null,
        relatedTransactionId: data.relatedTransactionId || null,
      },
    });
  }

  async createMany(
    data: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Transaction[]> {
    return Promise.all(data.map((d) => this.create(d)));
  }

  async update(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Transaction> {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  async sumByAccountAndStatus(
    accountId: string,
    status: TransactionStatus,
    type?: 'INCOME' | 'EXPENSE'
  ): Promise<string> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        accountId,
        status,
        ...(type && { type }),
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount?.toString() || '0';
  }

  async countRecurringTransactions(recurringRuleId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        recurringRuleId,
      },
    });
  }

  async findFutureTransactionsByAccount(
    userId: string,
    accountId: string,
    beforeDate: Date
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        accountId,
        dueDate: {
          lte: beforeDate,
        },
      },
    });
  }
}
