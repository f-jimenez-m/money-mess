import { FastifyInstance } from 'fastify';
import { AccountsController } from '@controllers/accounts.controller';
import { PrismaClient } from '@prisma/client';

export async function registerAccountRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  const controller = new AccountsController(prisma);
  AccountsController.registerRoutes(fastify, controller);
}
