import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BalanceService } from '@services';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@utils/errors';

/**
 * BalanceController
 *
 * Maneja operaciones de saldo:
 * - Obtener saldo de una cuenta
 * - Obtener saldos de todas las cuentas del usuario
 * - Obtener saldo total
 */
export class BalanceController {
  private balanceService: BalanceService;

  constructor(private prisma: PrismaClient) {
    this.balanceService = new BalanceService(prisma);
  }

  /**
   * GET /accounts/:id/balance
   * Obtener el saldo actual de una cuenta específica
   */
  async getAccountBalance(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const { id: accountId } = request.params;

      const balance = await this.balanceService.getAccountBalance(userId, accountId);

      return reply.send({
        success: true,
        data: balance,
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
   * GET /accounts/balances
   * Obtener los saldos de todas las cuentas del usuario
   */
  async getAllAccountsBalance(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;

      const balances = await this.balanceService.getAllAccountsBalance(userId);

      // Calcular total
      const total = await this.balanceService.getTotalBalance(userId);

      return reply.send({
        success: true,
        data: {
          accounts: balances,
          total: total.toString(),
          count: balances.length,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /balance/total
   * Obtener el saldo total de todas las cuentas del usuario
   */
  async getTotalBalance(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;

      const total = await this.balanceService.getTotalBalance(userId);

      return reply.send({
        success: true,
        data: {
          total: total.toString(),
          currency: 'USD',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registrar rutas en Fastify
   */
  static registerRoutes(fastify: FastifyInstance, controller: BalanceController) {
    fastify.get<{ Params: { id: string } }>(
      '/api/accounts/:id/balance',
      { onRequest: [(fastify as any).authenticate] },
      (request, reply) => controller.getAccountBalance(request, reply)
    );

    fastify.get(
      '/api/accounts/balances',
      { onRequest: [(fastify as any).authenticate] },
      (request, reply) => controller.getAllAccountsBalance(request, reply)
    );

    fastify.get(
      '/api/balance/total',
      { onRequest: [(fastify as any).authenticate] },
      (request, reply) => controller.getTotalBalance(request, reply)
    );
  }
}
