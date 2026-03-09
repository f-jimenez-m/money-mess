import { FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR');
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(404, `${resource} with id ${id} not found`, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export const errorHandler = (error: Error, request: FastifyRequest, reply: FastifyReply) => {
  request.log.error(error);

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.code,
      message: error.message,
      ...(error instanceof ValidationError && error.details && { details: error.details }),
    });
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      return reply.status(409).send({
        statusCode: 409,
        error: 'CONFLICT',
        message: `${field} already exists`,
      });
    }

    if (prismaError.code === 'P2025') {
      return reply.status(404).send({
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Resource not found',
      });
    }
  }

  // Default error response
  reply.status(500).send({
    statusCode: 500,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  });
};

export const createSuccessResponse = <T>(data: T, message: string = 'Success') => ({
  success: true,
  message,
  data,
});
