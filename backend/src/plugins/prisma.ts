import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

// Extend Fastify instance with Prisma
declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient;
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export default fp(
  async (fastify: FastifyInstance) => {
    if (!prisma) {
      prisma = new PrismaClient();
    }

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async () => {
      await prisma.$disconnect();
    });
  },
  {
    name: 'prisma',
  }
);
