import { FastifyInstance } from 'fastify';
import { createSuccessResponse } from '@utils/errors';

export default async (app: FastifyInstance) => {
  app.get('/health', async (request, reply) => {
    return createSuccessResponse(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      'Health check passed'
    );
  });
};
