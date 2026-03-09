import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { CreateAccountSchema, UpdateAccountSchema } from '@schemas';
import { ValidationError, NotFoundError, AppError } from '@utils/errors';

/**
 * AccountsController
 *
 * Handles all account operations (CRUD)
 */
export class AccountsController {
  constructor(private prisma: PrismaClient) {}

  /**
   * GET /api/accounts
   * Get all accounts for the user
   */
  async getAccounts(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;

      const accounts = await this.prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /api/accounts/:id
   * Get a specific account
   */
  async getAccount(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const account = await this.prisma.account.findFirst({
        where: { id, userId },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      return reply.send({
        success: true,
        data: account,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/accounts
   * Create a new account
   */
  async createAccount(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;

      // Validate input
      const validation = CreateAccountSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        });
      }

      const { name, type, currency, initialBalance } = validation.data;

      // Create account
      const account = await this.prisma.account.create({
        data: {
          name,
          type,
          currency,
          userId,
        },
      });

      // If initial balance provided, create an initial transaction
      if (initialBalance && initialBalance > 0) {
        await this.prisma.transaction.create({
          data: {
            userId,
            accountId: account.id,
            type: 'INCOME',
            amount: initialBalance,
            description: `Initial balance: ${name}`,
            dueDate: new Date(),
            status: 'PAID',
            paidDate: new Date(),
            categoryId: null,
            recurringRuleId: null,
            installmentNumber: null,
            installmentTotal: null,
            transferGroupId: null,
            relatedTransactionId: null,
          },
        });
      }

      return reply.code(201).send({
        success: true,
        data: account,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.message,
          details: (error as any).details,
        });
      }
      throw error;
    }
  }

  /**
   * PATCH /api/accounts/:id
   * Update an account
   */
  async updateAccount(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      // Verify account exists and belongs to user
      const account = await this.prisma.account.findFirst({
        where: { id, userId },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      // Validate input
      const validation = UpdateAccountSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        });
      }

      const updated = await this.prisma.account.update({
        where: { id },
        data: validation.data,
      });

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.message,
          details: (error as any).details,
        });
      }
      throw error;
    }
  }

  /**
   * DELETE /api/accounts/:id
   * Delete an account
   */
  async deleteAccount(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      // Verify account exists and belongs to user
      const account = await this.prisma.account.findFirst({
        where: { id, userId },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      // Delete all transactions associated with this account
      await this.prisma.transaction.deleteMany({
        where: { accountId: id },
      });

      // Delete the account
      await this.prisma.account.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register routes in Fastify
   */
  static registerRoutes(fastify: FastifyInstance, controller: AccountsController) {
    const auth = (fastify as any).authenticate;

    fastify.get(
      '/api/accounts',
      { onRequest: [auth] },
      (request, reply) => controller.getAccounts(request, reply)
    );

    fastify.get<{ Params: { id: string } }>(
      '/api/accounts/:id',
      { onRequest: [auth] },
      (request, reply) => controller.getAccount(request, reply)
    );

    fastify.post(
      '/api/accounts',
      { onRequest: [auth] },
      (request, reply) => controller.createAccount(request, reply)
    );

    fastify.patch<{ Params: { id: string } }>(
      '/api/accounts/:id',
      { onRequest: [auth] },
      (request, reply) => controller.updateAccount(request, reply)
    );

    fastify.delete<{ Params: { id: string } }>(
      '/api/accounts/:id',
      { onRequest: [auth] },
      (request, reply) => controller.deleteAccount(request, reply)
    );
  }
}
