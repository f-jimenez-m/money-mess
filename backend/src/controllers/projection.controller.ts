import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProjectionService } from '@services';
import { PrismaClient } from '@prisma/client';

/**
 * ProjectionController
 *
 * Maneja operaciones de proyección de saldos
 */
export class ProjectionController {
  private projectionService: ProjectionService;

  constructor(private prisma: PrismaClient) {
    this.projectionService = new ProjectionService(prisma);
  }

  /**
   * GET /accounts/:id/projection
   * Obtener la proyección de saldo de una cuenta específica
   */
  async getAccountProjection(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const { id: accountId } = request.params;
      const query = request.query as any;
      const days = query.days ? parseInt(query.days) : 30;

      // Verificar que la cuenta pertenece al usuario
      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      const projection = await this.projectionService.getAccountProjection(accountId, days.toString());

      return reply.send({
        success: true,
        data: projection,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /projection
   * Obtener proyecciones de todas las cuentas del usuario
   */
  async getAllAccountsProjection(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const query = request.query as any;
      const days = query.days ? parseInt(query.days) : 30;

      // Obtener todas las cuentas del usuario
      const accounts = await this.prisma.account.findMany({
        where: { userId },
      });

      // Obtener proyecciones
      const projections = await Promise.all(
        accounts.map(async (account) => {
          const projection = await this.projectionService.getAccountProjection(account.id, days.toString());
          return {
            ...projection,
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
          };
        })
      );

      return reply.send({
        success: true,
        data: {
          projections,
          count: projections.length,
          daysProjected: days,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /projection/monthly
   * Obtener proyección mensual de todas las cuentas
   */
  async getMonthlyProjection(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const query = request.query as any;
      const months = query.months ? parseInt(query.months) : 3;

      // Obtener todas las cuentas del usuario
      const accounts = await this.prisma.account.findMany({
        where: { userId },
      });

      // Obtener proyecciones mensuales
      const now = new Date();
      const monthlyProjections = await Promise.all(
        accounts.map(async (account) => {
          const projection = await this.projectionService.getMonthlyProjection(
            userId,
            account.id,
            now.getFullYear(),
            now.getMonth() + 1
          );
          return {
            accountId: account.id,
            accountName: account.name,
            monthly: projection,
          };
        })
      );

      return reply.send({
        success: true,
        data: {
          accounts: monthlyProjections,
          months,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /projection/timeline/:id
   * Obtener línea de tiempo de proyección (cambios día a día)
   */
  async getProjectionTimeline(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const { id: accountId } = request.params;
      const query = request.query as any;
      const days = query.days ? parseInt(query.days) : 30;

      // Verificar que la cuenta pertenece al usuario
      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      const timeline = await this.projectionService.getProjectionTimeline(accountId, days.toString());

      return reply.send({
        success: true,
        data: {
          accountId,
          accountName: account.name,
          timeline,
          daysProjected: days,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registrar rutas en Fastify
   */
  static registerRoutes(fastify: FastifyInstance, controller: ProjectionController) {
    const auth = (fastify as any).authenticate;

    fastify.get<{ Params: { id: string } }>(
      '/api/accounts/:id/projection',
      { onRequest: [auth] },
      (request, reply) => controller.getAccountProjection(request, reply)
    );

    fastify.get(
      '/api/projection',
      { onRequest: [auth] },
      (request, reply) => controller.getAllAccountsProjection(request, reply)
    );

    fastify.get(
      '/api/projection/monthly',
      { onRequest: [auth] },
      (request, reply) => controller.getMonthlyProjection(request, reply)
    );

    fastify.get<{ Params: { id: string } }>(
      '/api/projection/timeline/:id',
      { onRequest: [auth] },
      (request, reply) => controller.getProjectionTimeline(request, reply)
    );
  }
}
