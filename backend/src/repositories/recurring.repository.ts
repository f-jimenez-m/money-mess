import { PrismaClient, RecurringRule } from '@prisma/client';

export class RecurringRuleRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<RecurringRule | null> {
    return this.prisma.recurringRule.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<RecurringRule | null> {
    return this.prisma.recurringRule.findFirst({
      where: { id, userId },
    });
  }

  async findManyByUserId(userId: string): Promise<RecurringRule[]> {
    return this.prisma.recurringRule.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });
  }

  async findActiveRules(userId: string, beforeDate: Date): Promise<RecurringRule[]> {
    return this.prisma.recurringRule.findMany({
      where: {
        userId,
        startDate: {
          lte: beforeDate,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: beforeDate } },
        ],
      },
    });
  }

  async create(data: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringRule> {
    return this.prisma.recurringRule.create({
      data: {
        ...data,
        id: undefined,
      } as any,
    });
  }

  async update(
    id: string,
    data: Partial<Omit<RecurringRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<RecurringRule> {
    return this.prisma.recurringRule.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<RecurringRule> {
    return this.prisma.recurringRule.delete({
      where: { id },
    });
  }
}
