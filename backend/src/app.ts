import Fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { config } from '@config/env';
import { errorHandler } from '@utils/errors';

// Plugins
import prismaPlugin from '@plugins/prisma';
import authPlugin from '@plugins/auth';

// Routes
import healthRoutes from '@routes/health';
import { registerAuthRoutes } from '@modules/auth';
import {
  registerTransactionRoutes,
  registerAccountRoutes,
  registerCategoryRoutes,
  registerRecurringRoutes,
  registerBalanceRoutes,
  registerProjectionRoutes,
} from '@routes';

export const createApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport:
        config.server.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  await app.register(fastifyCors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Register health check route
  await app.register(healthRoutes);

  // Register authentication routes (public)
  await registerAuthRoutes(app, app.prisma);

  // Register API routes (some protected)
  await registerTransactionRoutes(app, app.prisma);
  await registerAccountRoutes(app, app.prisma);
  await registerCategoryRoutes(app, app.prisma);
  await registerRecurringRoutes(app, app.prisma);
  await registerBalanceRoutes(app, app.prisma);
  await registerProjectionRoutes(app, app.prisma);

  // Global error handler
  app.setErrorHandler(errorHandler);

  return app;
};
