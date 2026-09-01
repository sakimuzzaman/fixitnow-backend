import { z } from 'zod';

const createCategory = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
    icon: z.string().url('Icon must be a valid URL').optional(),
  }),
});

const updateCategory = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),

  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    icon: z.string().url().optional(),
  }),
});

export const CategoryValidation = { createCategory, updateCategory };