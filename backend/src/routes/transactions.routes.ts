import { FastifyInstance } from 'fastify';
import { TransactionController } from '@controllers/transaction.controller';
import { PrismaClient } from '@prisma/client';

export async function registerTransactionRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  const controller = new TransactionController(prisma);
  TransactionController.registerRoutes(fastify, controller);
}
