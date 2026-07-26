import httpStatus from 'http-status';
import Stripe from 'stripe';

import AppError from '../../utils/AppError.js';
import config from '../../config/index.js';
import prisma from '../../shared/prisma.js';


const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2026-06-24.dahlia',
  });

// ============================
// Create Payment Intent
// ============================
// const createPaymentIntent = async (userId: string, bookingId: string) => {
//   // 1. Validate booking exists and belongs to user
//   const booking = await prisma.booking.findUnique({
//     where: { id: bookingId },
//     include: {
//       service: true,
//       technicianProfile: true,
//       customer: true,
//       payment: true,
//     },
//   });

//   if (!booking) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
//   }

//   if (booking.customerId !== userId) {
//     throw new AppError(httpStatus.FORBIDDEN, 'You can only pay for your own bookings');
//   }

//   // 2. Check if booking is ACCEPTED (can only pay after technician accepts)
//   if (booking.status !== 'ACCEPTED') {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       `Cannot pay for booking. Status: ${booking.status}. Only ACCEPTED bookings can be paid.`
//     );
//   }

//   // 3. Check if payment already exists
//   if (booking.payment) {
//     if (booking.payment.status === 'COMPLETED') {
//       throw new AppError(httpStatus.BAD_REQUEST, 'Payment already completed');
//     }
//     if (booking.payment.transactionId) {
//       // Return existing payment intent
//       return {
//         clientSecret: booking.payment.transactionId,
//         paymentId: booking.payment.id,
//         amount: booking.payment.amount,
//       };
//     }
//   }

//   // 4. Create Stripe Payment Intent
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: Math.round(booking.totalAmount * 100), // Stripe uses cents
//     currency: 'usd',
//     metadata: {
//       bookingId: booking.id,
//       userId: userId,
//       technicianId: booking.technicianProfileId,
//     },
//     automatic_payment_methods: {
//       enabled: true,
//     },
//   });

//   // 5. Create or update payment record
//   const payment = await prisma.payment.upsert({
//     where: { bookingId: booking.id },
//     create: {
//       bookingId: booking.id,
//       userId: userId,
//       transactionId: paymentIntent.client_secret!,
//       amount: booking.totalAmount,
//       provider: 'STRIPE',
//       status: 'PENDING',
//     },
//     update: {
//       transactionId: paymentIntent.client_secret!,
//       status: 'PENDING',
//     },
//   });

//   return {
//     clientSecret: paymentIntent.client_secret,
//     paymentId: payment.id,
//     amount: booking.totalAmount,
//     currency: 'usd',
//     bookingId: booking.id,
//   };
// };

const createPaymentIntent = async (userId: string, bookingId: string) => {
  // 1. Validate booking exists and belongs to user
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      technicianProfile: true,
      customer: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only pay for your own bookings'
    );
  }

  // 2. Booking must be accepted
  if (booking.status !== 'ACCEPTED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot pay for booking. Status: ${booking.status}. Only ACCEPTED bookings can be paid.`
    );
  }

  // 3. Already paid?
  if (booking.payment?.status === 'COMPLETED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment already completed'
    );
  }

  // 4. Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalAmount * 100),
    currency: 'usd',
    metadata: {
      bookingId: booking.id,
      userId,
      technicianId: booking.technicianProfileId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // 5. Save the PAYMENT INTENT ID
  // NOT the client_secret
  const payment = await prisma.payment.upsert({
    where: {
      bookingId: booking.id,
    },
    create: {
      bookingId: booking.id,
      userId,
      transactionId: paymentIntent.id,
      amount: booking.totalAmount,
      provider: 'STRIPE',
      status: 'PENDING',
    },
    update: {
      transactionId: paymentIntent.id,
      status: 'PENDING',
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    paymentId: payment.id,
    amount: booking.totalAmount,
    currency: 'usd',
    bookingId: booking.id,
  };
};

// ============================
// Confirm Payment (Webhook/Callback)
// ============================

const confirmPayment = async (userId: string, paymentIntentId: string) => {
    // 1. Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentIntentId,
      },
      include: {
        booking: {
          include: {
            service: true,
            technicianProfile: true,
          },
        },
      },
    });
  
    if (!payment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Payment record not found"
      );
    }
  
    // 2. Verify payment belongs to the current user
    if (payment.userId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Unauthorized payment access"
      );
    }
  
    // 3. Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
    if (paymentIntent.status !== "succeeded") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment not successful"
      );
    }
  
    // 4. Update payment and booking inside a transaction
    const updatedPayment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
          transactionId: paymentIntent.id,
        },
      });
  
      await tx.booking.update({
        where: {
          id: payment.bookingId,
        },
        data: {
          status: "PAID",
        },
      });
  
      return updatedPayment;
    });
  
    return updatedPayment;
  };

// ============================
// Get Payment History
// ============================
const getPaymentHistory = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      booking: {
        include: {
          service: {
            include: {
              category: true,
              technicianProfile: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};

// ============================
// Get Payment by ID
// ============================
const getPaymentById = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: {
            include: {
              category: true,
            },
          },
          technicianProfile: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (payment.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Unauthorized payment access');
  }

  return payment;
};

// ============================
// Handle Stripe Webhook
// ============================
const handleWebhook = async (signature: string, payload: Buffer) => {
//   const endpointSecret = config.stripe_webhook_secret as string;
   const endpointSecret = config.stripe.webhookSecret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    throw new AppError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSucceeded(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(failedIntent);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { received: true };
};

// Helper: Payment Succeeded
const handlePaymentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  const bookingId = paymentIntent.metadata?.bookingId;
  const transactionId = paymentIntent.id;

  if (!bookingId) {
    console.log('No booking ID in payment intent metadata');
    return;
  }

  await prisma.$transaction(async (tx : any) => {
    await tx.payment.updateMany({
      where: {
        bookingId: bookingId,
      },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        transactionId: transactionId,
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'PAID',
      },
    });
  });

  console.log(`Payment succeeded for booking: ${bookingId}`);
};

// Helper: Payment Failed
const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) {
    console.log('No booking ID in payment intent metadata');
    return;
  }

  await prisma.payment.updateMany({
    where: {
      bookingId: bookingId,
    },
    data: {
      status: 'FAILED',
    },
  });

  console.log(`Payment failed for booking: ${bookingId}`);
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
};