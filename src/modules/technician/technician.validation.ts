import { z } from 'zod';

const updateProfile = z.object({
  body: z.object({
    bio: z.string().min(10, 'Bio must be at least 10 characters').optional(),
    experienceYears: z
      .number()
      .min(0, 'Experience cannot be negative')
      .max(50)
      .optional(),
    skills: z
      .array(z.string().min(1))
      .min(1, 'At least one skill is required')
      .optional(),
    hourlyRate: z.number().min(0, 'Rate must be positive').optional(),
  }),
});

const updateAvailability = z.object({
  body: z.object({
    slots: z.array(
      z.object({
        dayOfWeek: z.enum([
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ]),
        startTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format'),
        endTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format'),
        isAvailable: z.boolean().default(true),
      })
    ).min(1, 'At least one availability slot is required'),
  }),
});

export const TechnicianValidation = {
  updateProfile,
  updateAvailability,
};