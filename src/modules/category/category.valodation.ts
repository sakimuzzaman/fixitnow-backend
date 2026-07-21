import { z } from 'zod';

const createCategory = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
    icon: z.string().url('Icon must be a valid URL').optional(),
  }),
});

export const CategoryValidation = { createCategory };