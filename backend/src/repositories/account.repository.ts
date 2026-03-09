import { PrismaClient, Account } from '@prisma/client';

export class AccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: { id, userId },
    });
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: { userId, name },
    });
  }

  async findManyByUserId(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    return this.prisma.account.create({
      data: {
        ...data,
        id: undefined,
      } as any,
    });
  }

  async update(
    id: string,
    data: Partial<Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Account> {
    return this.prisma.account.delete({
      where: { id },
    });
  }
}
