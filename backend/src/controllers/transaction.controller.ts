import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '@services';
import { PrismaClient } from '@prisma/client';
import { CreateTransactionDTO, CreateTransferDTO } from '@types';
import { ValidationError, NotFoundError, AppError } from '@utils/errors';

/**
 * TransactionController
 *
 * Maneja todas las operaciones relacionadas con transacciones
 */
export class TransactionController {
  private transactionService: TransactionService;

  constructor(private prisma: PrismaClient) {
    this.transactionService = new TransactionService(prisma);
  }

  /**
   * POST /transactions
   * Crear una nueva transacción (ingreso o gasto)
   */
  async createTransaction(
    request: FastifyRequest<{
      Body: CreateTransactionDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const dto = request.body;

      const transaction = await this.transactionService.createTransaction(userId, dto);

      return reply.code(201).send({
        success: true,
        data: transaction,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.message,
          details: (error as any).details,
        });
      }
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * POST /transfers
   * Crear una transferencia entre dos cuentas
   */
  async createTransfer(
    request: FastifyRequest<{
      Body: CreateTransferDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const dto = request.body;

      const transfer = await this.transactionService.createTransfer(userId, dto);

      return reply.code(201).send({
        success: true,
        data: transfer,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          success: false,
          error: error.message,
          details: (error as any).details,
        });
      }
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * GET /transactions
   * Obtener todas las transacciones del usuario con filtros opcionales
   */
  async getTransactions(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const query = request.query as any;

      // Usar prisma directamente para obtener transacciones con filtros
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          accountId: query.accountId,
          categoryId: query.categoryId,
          status: query.status,
          type: query.type,
          dueDate: {
            gte: query.startDate ? new Date(query.startDate) : undefined,
            lte: query.endDate ? new Date(query.endDate) : undefined,
          },
        },
        orderBy: {
          dueDate: 'desc',
        },
      });

      return reply.send({
        success: true,
        data: transactions.map((t) => this.transactionService['mapToResponse'](t)),
        count: transactions.length,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /transactions/:id
   * Obtener una transacción por ID
   */
  async getTransaction(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const transaction = await this.transactionService.getTransaction(userId, id);

      if (!transaction) {
        return reply.code(404).send({
          success: false,
          error: 'Transaction not found',
        });
      }

      return reply.send({
        success: true,
        data: transaction,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * PATCH /transactions/:id/pay
   * Marcar una transacción como pagada
   */
  async markAsPaid(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const transaction = await this.transactionService.markTransactionAsPaid(userId, id);

      return reply.send({
        success: true,
        data: transaction,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * PATCH /transactions/:id/pending
   * Marcar una transacción como pendiente
   */
  async markAsPending(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const transaction = await this.transactionService.markTransactionAsPending(userId, id);

      return reply.send({
        success: true,
        data: transaction,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * DELETE /transactions/:id
   * Eliminar una transacción
   */
  async deleteTransaction(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      await this.transactionService.deleteTransaction(userId, id);

      return reply.send({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Registrar rutas en Fastify
   */
  static registerRoutes(fastify: FastifyInstance, controller: TransactionController) {
    const auth = (fastify as any).authenticate;

    fastify.post<{ Body: CreateTransactionDTO }>(
      '/api/transactions',
      { onRequest: [auth] },
      (request, reply) => controller.createTransaction(request, reply)
    );

    fastify.post<{ Body: CreateTransferDTO }>(
      '/api/transfers',
      { onRequest: [auth] },
      (request, reply) => controller.createTransfer(request, reply)
    );

    fastify.get(
      '/api/transactions',
      { onRequest: [auth] },
      (request, reply) => controller.getTransactions(request, reply)
    );

    fastify.get<{ Params: { id: string } }>(
      '/api/transactions/:id',
      { onRequest: [auth] },
      (request, reply) => controller.getTransaction(request, reply)
    );

    fastify.patch<{ Params: { id: string } }>(
      '/api/transactions/:id/pay',
      { onRequest: [auth] },
      (request, reply) => controller.markAsPaid(request, reply)
    );

    fastify.patch<{ Params: { id: string } }>(
      '/api/transactions/:id/pending',
      { onRequest: [auth] },
      (request, reply) => controller.markAsPending(request, reply)
    );

    fastify.delete<{ Params: { id: string } }>(
      '/api/transactions/:id',
      { onRequest: [auth] },
      (request, reply) => controller.deleteTransaction(request, reply)
    );
  }
}
