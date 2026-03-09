import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.schema';
import { ValidationError } from '@utils/errors';

/**
 * AuthController
 *
 * Handles authentication operations (register, login, profile)
 */
export class AuthController {
  private authService: AuthService;

  constructor(private prisma: PrismaClient, jwtSecret: string) {
    this.authService = new AuthService({
      prisma,
      jwtSecret,
    });
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      // Validate input
      const validation = RegisterSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        });
      }

      // Register user
      const user = await this.authService.register(validation.data);

      return reply.code(201).send({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email already registered') {
        return reply.code(409).send({
          success: false,
          error: 'Email already registered',
        });
      }
      throw error;
    }
  }

  /**
   * POST /api/auth/login
   * Login user and return JWT token
   */
  async login(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      // Validate input
      const validation = LoginSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        });
      }

      // Login user
      const user = await this.authService.login(validation.data);

      // Generate JWT token
      const token = (request.server as any).jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        { expiresIn: '7d' }
      );

      return reply.send({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: token,
          user: {
            id: user.id,
            email: user.email,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }
      throw error;
    }
  }

  /**
   * GET /api/auth/me
   * Get authenticated user profile
   */
  async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.userId || (request.user as any)?.userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await this.authService.getUserById(userId);

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
        });
      }
      throw error;
    }
  }

  /**
   * Register routes in Fastify
   */
  static registerRoutes(fastify: FastifyInstance, controller: AuthController) {
    const auth = (fastify as any).authenticate;

    // Public routes
    fastify.post(
      '/api/auth/register',
      (request, reply) => controller.register(request, reply)
    );

    fastify.post(
      '/api/auth/login',
      (request, reply) => controller.login(request, reply)
    );

    // Protected routes
    fastify.get(
      '/api/auth/me',
      { onRequest: [auth] },
      (request, reply) => controller.getProfile(request, reply)
    );
  }
}
