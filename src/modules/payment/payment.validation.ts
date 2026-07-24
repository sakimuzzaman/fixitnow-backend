import { z } from 'zod';

const createPayment = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID'),
  }),
});

const confirmPayment = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  }),
});

export const PaymentValidation = {
  createPayment,
  confirmPayment,
};