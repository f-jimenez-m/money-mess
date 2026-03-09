import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { config } from '@config/env';

/**
 * Register authentication routes
 */
export async function registerAuthRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
): Promise<void> {
  const authController = new AuthController(prisma, config.jwt.secret);

  AuthController.registerRoutes(fastify, authController);
}
