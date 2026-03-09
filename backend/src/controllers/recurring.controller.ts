import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RecurringService } from '@services';
import { PrismaClient } from '@prisma/client';
import { CreateRecurringRuleDTO } from '@types';
import { ValidationError, NotFoundError } from '@utils/errors';

/**
 * RecurringController
 *
 * Maneja operaciones de transacciones recurrentes
 */
export class RecurringController {
  private recurringService: RecurringService;

  constructor(private prisma: PrismaClient) {
    this.recurringService = new RecurringService(prisma);
  }

  /**
   * POST /recurring-rules
   * Crear una nueva regla de recurrencia
   */
  async createRecurringRule(
    request: FastifyRequest<{
      Body: CreateRecurringRuleDTO;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const dto = request.body;

      const rule = await this.recurringService.createRecurringRule(userId, dto);

      return reply.code(201).send({
        success: true,
        data: rule,
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
   * GET /recurring-rules
   * Obtener todas las reglas de recurrencia del usuario
   */
  async getRecurringRules(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;

      const rules = await this.recurringService.getRecurringRules(userId);

      return reply.send({
        success: true,
        data: rules,
        count: rules.length,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /recurring-rules/:id
   * Obtener una regla específica
   */
  async getRecurringRule(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      const rule = await this.prisma.recurringRule.findFirst({
        where: { id, userId },
      });

      if (!rule) {
        return reply.code(404).send({
          success: false,
          error: 'Recurring rule not found',
        });
      }

      return reply.send({
        success: true,
        data: rule,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /recurring-rules/execute
   * Ejecutar generación de transacciones recurrentes
   */
  async executeRecurringGeneration(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;

      const result = await this.recurringService.executeRecurringGeneration();

      return reply.send({
        success: true,
        data: result,
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
   * DELETE /recurring-rules/:id
   * Eliminar una regla de recurrencia
   */
  async deleteRecurringRule(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request.user as any).id;
      const { id } = request.params;

      await this.recurringService.deleteRecurringRule(userId, id);

      return reply.send({
        success: true,
        message: 'Recurring rule deleted successfully',
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
  static registerRoutes(fastify: FastifyInstance, controller: RecurringController) {
    const auth = (fastify as any).authenticate;

    fastify.post<{ Body: CreateRecurringRuleDTO }>(
      '/api/recurring-rules',
      { onRequest: [auth] },
      (request, reply) => controller.createRecurringRule(request, reply)
    );

    fastify.get(
      '/api/recurring-rules',
      { onRequest: [auth] },
      (request, reply) => controller.getRecurringRules(request, reply)
    );

    fastify.get<{ Params: { id: string } }>(
      '/api/recurring-rules/:id',
      { onRequest: [auth] },
      (request, reply) => controller.getRecurringRule(request, reply)
    );

    fastify.post(
      '/api/recurring-rules/execute',
      { onRequest: [auth] },
      (request, reply) => controller.executeRecurringGeneration(request, reply)
    );

    fastify.delete<{ Params: { id: string } }>(
      '/api/recurring-rules/:id',
      { onRequest: [auth] },
      (request, reply) => controller.deleteRecurringRule(request, reply)
    );
  }
}
