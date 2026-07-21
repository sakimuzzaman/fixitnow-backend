import { z } from 'zod';

const createService = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().min(0, 'Price must be greater than 0'),
    duration: z.number().min(15, 'Duration must be at least 15 minutes'),
    location: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID'),
  }),
});

const updateService = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    duration: z.number().min(15).optional(),
    location: z.string().optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

export const ServiceValidation = { createService, updateService };