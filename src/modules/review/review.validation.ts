import { z } from 'zod';

// const createReview = z.object({
//   body: z.object({
//     bookingId: z.string().uuid(),
//     rating: z.number().min(1).max(5),
//     comment: z.string().optional(),
//   }),
// });


const createReview = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID"),
  }),

  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const ReviewValidation = { createReview };