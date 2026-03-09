import { FastifyInstance } from 'fastify';
import { CategoriesController } from '@controllers/categories.controller';
import { PrismaClient } from '@prisma/client';

export async function registerCategoryRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  const controller = new CategoriesController(prisma);
  CategoriesController.registerRoutes(fastify, controller);
}
