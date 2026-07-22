import { z } from 'zod';

const createBooking = z.object({
  body: z.object({
    serviceId: z.string().uuid('Invalid service ID'),
    scheduledAt: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      'scheduledAt must be a valid ISO datetime string'
    ),
    address: z.string().min(10, 'Address must be at least 10 characters'),
    notes: z.string().optional(),
  }),
});

const updateBookingStatus = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    note: z.string().optional(),
  }),
});

export const BookingValidation = {
  createBooking,
  updateBookingStatus,
};