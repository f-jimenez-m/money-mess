import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt, { FastifyJWT } from '@fastify/jwt';
import { config } from '@config/env';

declare module 'fastify' {
  interface FastifyInstance extends FastifyJWT {}

  interface FastifyRequest {
    userId?: string;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(jwt, {
      secret: config.jwt.secret,
      sign: {
        expiresIn: config.jwt.expiresIn,
      },
    });

    // Decorator para verificar si la ruta requiere autenticación
    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        // Extraer userId del token payload
        const payload = request.user as any;
        request.userId = payload?.userId || payload?.id;
      } catch (error) {
        reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No valid token provided',
        });
      }
    });
  },
  {
    name: 'auth',
  }
);
