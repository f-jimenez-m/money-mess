import { FastifyInstance } from 'fastify';
import { BalanceController } from '@controllers/balance.controller';
import { ProjectionController } from '@controllers/projection.controller';
import { PrismaClient } from '@prisma/client';

export async function registerBalanceRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  const balanceController = new BalanceController(prisma);
  BalanceController.registerRoutes(fastify, balanceController);
}

export async function registerProjectionRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  const projectionController = new ProjectionController(prisma);
  ProjectionController.registerRoutes(fastify, projectionController);
}
