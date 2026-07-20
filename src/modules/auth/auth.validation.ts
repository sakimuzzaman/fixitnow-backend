import { z } from 'zod';

const register = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
      role: z.enum(['CUSTOMER', 'TECHNICIAN'], {
        message: 'Role must be CUSTOMER or TECHNICIAN',
      }),
    phone: z.string().optional(),
    location: z.string().optional(),
  }),
});

const login = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const AuthValidation = { register, login };