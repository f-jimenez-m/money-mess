import { z } from 'zod';

/**
 * Schema for creating a category
 */
export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255).describe('Category name'),
  type: z.enum(['INCOME', 'EXPENSE'] as const).describe('Category type'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#6B7280').describe('Category color (hex code)'),
  icon: z.string().max(50).optional().describe('Category icon name (optional)'),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

/**
 * Schema for updating a category
 */
export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Category name'),
  type: z.enum(['INCOME', 'EXPENSE'] as const).optional().describe('Category type'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().describe('Category color (hex code)'),
  icon: z.string().max(50).optional().describe('Category icon name (optional)'),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
