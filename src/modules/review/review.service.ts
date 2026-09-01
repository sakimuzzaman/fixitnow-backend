import httpStatus from 'http-status';
import prisma from '../../shared/prisma.js';
import AppError from '../../utils/AppError.js';


// const createReview = async (userId: string, payload: any, body: any) => {
//   const { bookingId, rating, comment } = payload;

//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//     include: { technicianProfile: true },
//   });

//   if (!booking || booking.customerId !== userId) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
//   }

//   if (booking.status !== 'COMPLETED') {
//     throw new AppError(httpStatus.BAD_REQUEST, 'You can only review completed jobs');
//   }

//   // Check if review exists
//   const existingReview = await prisma.review.findUnique({
//     where: { bookingId },
//   });

//   if (existingReview) {
//     throw new AppError(httpStatus.CONFLICT, 'Review already submitted');
//   }

//   const review = await prisma.$transaction(async (tx) => {
//     const newReview = await tx.review.create({
//       data: {
//         bookingId,
//         customerId: userId,
//         technicianProfileId: booking.technicianProfileId,
//         rating,
//         comment,
//       },
//     });

//     // Update technician rating
//     const profile = await tx.technicianProfile.findUnique({
//       where: { id: booking.technicianProfileId },
//     });

//     const currentTotalReviews = (profile?.totalReviews || 0) + 1;
//     const currentRatingSum = (profile?.ratingAvg || 0) * (profile?.totalReviews || 0) + rating;
//     const newAverage = currentRatingSum / currentTotalReviews;

//     await tx.technicianProfile.update({
//       where: { id: booking.technicianProfileId },
//       data: {
//         totalReviews: currentTotalReviews,
//         ratingAvg: newAverage,
//       },
//     });

//     return newReview;
//   });

//   return review;
// };

const createReview = async (
  userId: string,
  bookingId: string,
  payload: any
) => {
  const { rating, comment } = payload;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      technicianProfile: true,
    },
  });

  if (!booking || booking.customerId !== userId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Booking not found"
    );
  }

  if (booking.status !== "COMPLETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can only review completed jobs"
    );
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { bookingId },
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Review already submitted"
    );
  }

  const review = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        bookingId,
        customerId: userId,
        technicianProfileId: booking.technicianProfileId,
        rating,
        comment,
      },
    });

    const profile =
      await tx.technicianProfile.findUnique({
        where: {
          id: booking.technicianProfileId,
        },
      });

    const currentTotalReviews =
      (profile?.totalReviews || 0) + 1;

    const currentRatingSum =
      (profile?.ratingAvg || 0) *
        (profile?.totalReviews || 0) +
      rating;

    const newAverage =
      currentRatingSum / currentTotalReviews;

    await tx.technicianProfile.update({
      where: {
        id: booking.technicianProfileId,
      },
      data: {
        totalReviews: currentTotalReviews,
        ratingAvg: newAverage,
      },
    });

    return newReview;
  });

  return review;
};


export const ReviewService = { createReview };