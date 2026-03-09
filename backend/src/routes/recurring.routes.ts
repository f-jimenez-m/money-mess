import { FastifyInstance } from 'fastify';
import { RecurringController } from '@controllers/recurring.controller';
import { PrismaClient } from '@prisma/client';

export async function registerRecurringRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  const controller = new RecurringController(prisma);
  RecurringController.registerRoutes(fastify, controller);
}
