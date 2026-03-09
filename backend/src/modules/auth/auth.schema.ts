import { z } from 'zod';

/**
 * Schema for user registration
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .describe('User email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .describe('User password (min 8 chars, 1 uppercase, 1 number)'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Schema for user login
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .describe('User email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .describe('User password'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema for JWT token response
 */
export const TokenResponseSchema = z.object({
  accessToken: z.string().describe('JWT access token'),
  refreshToken: z.string().optional().describe('Optional refresh token'),
  expiresIn: z.number().describe('Token expiration time in seconds'),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

/**
 * Schema for authenticated user profile
 */
export const UserProfileSchema = z.object({
  id: z.string().cuid().describe('User ID'),
  email: z.string().email().describe('User email'),
  createdAt: z.date().describe('Account creation date'),
  updatedAt: z.date().describe('Last update date'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
