import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { CreateCategorySchema, UpdateCategorySchema } from '@schemas';
import { ValidationError } from '@utils/errors';

/**
 * CategoriesController
 *
 * Handles all category operations (CRUD)
 */
export class CategoriesController {
  constructor(private prisma: PrismaClient) {}

  /**
   * GET /api/categories
   * Get all categories for the user
   */
  async getCategories(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;

      const categories = await this.prisma.category.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({
        success: true,
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /api/categories/:id
   * Get a specific category
   */
  async getCategory(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const { id } = request.params;

      const category = await this.prisma.category.findFirst({
        where: { id, userId },
      });

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: 'Category not found',
        });
      }

      return reply.send({
        success: true,
        data: category,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /api/categories
   * Create a new category
   */
  async createCategory(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;

      // Validate input
      const validation = CreateCategorySchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        });
      }

      const { name, type, color, icon } = validation.data;

      const category = await this.prisma.category.create({
        data: {
          name,
          type,
          color,
          icon: icon || null,
          userId,
        },
      });

      return reply.code(201).send({
        success: true,
        data: category,
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
   * PATCH /api/categories/:id
   * Update a category
   */
  async updateCategory(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const { id } = request.params;

      // Verify category exists and belongs to user
      const category = await this.prisma.category.findFirst({
        where: { id, userId },
      });

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: 'Category not found',
        });
      }

      // Validate input
      const validation = UpdateCategorySchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        });
      }

      const updated = await this.prisma.category.update({
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
   * DELETE /api/categories/:id
   * Delete a category
   */
  async deleteCategory(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId || (request.user as any)?.id;
      const { id } = request.params;

      // Verify category exists and belongs to user
      const category = await this.prisma.category.findFirst({
        where: { id, userId },
      });

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: 'Category not found',
        });
      }

      // Delete all transactions that reference this category
      await this.prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });

      // Delete the category
      await this.prisma.category.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register routes in Fastify
   */
  static registerRoutes(fastify: FastifyInstance, controller: CategoriesController) {
    const auth = (fastify as any).authenticate;

    fastify.get(
      '/api/categories',
      { onRequest: [auth] },
      (request, reply) => controller.getCategories(request, reply)
    );

    fastify.get<{ Params: { id: string } }>(
      '/api/categories/:id',
      { onRequest: [auth] },
      (request, reply) => controller.getCategory(request, reply)
    );

    fastify.post(
      '/api/categories',
      { onRequest: [auth] },
      (request, reply) => controller.createCategory(request, reply)
    );

    fastify.patch<{ Params: { id: string } }>(
      '/api/categories/:id',
      { onRequest: [auth] },
      (request, reply) => controller.updateCategory(request, reply)
    );

    fastify.delete<{ Params: { id: string } }>(
      '/api/categories/:id',
      { onRequest: [auth] },
      (request, reply) => controller.deleteCategory(request, reply)
    );
  }
}
