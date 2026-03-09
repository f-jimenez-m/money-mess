import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { RegisterInput, LoginInput, TokenResponse } from './auth.schema';

export interface AuthServiceOptions {
  prisma: PrismaClient;
  jwtSecret: string;
  jwtExpiresIn?: string;
}

export class AuthService {
  private prisma: PrismaClient;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(options: AuthServiceOptions) {
    this.prisma = options.prisma;
    this.jwtSecret = options.jwtSecret;
    this.jwtExpiresIn = options.jwtExpiresIn || '7d';
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
      },
    });

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatch) {
      throw new Error('Invalid credentials');
    }

    // Return user data (token generation handled by JWT plugin)
    return {
      id: user.id,
      email: user.email,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Verify if user exists
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return !!user;
  }
}
