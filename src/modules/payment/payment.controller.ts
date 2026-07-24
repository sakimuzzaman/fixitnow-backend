import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { PaymentService } from './payment.service.js';

// Create payment intent
const createPaymentIntent = catchAsync(async (req: any, res : any) => {
  const result = await PaymentService.createPaymentIntent(req.user.id, req.body.bookingId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment intent created successfully',
    data: result,
  });
});

// Confirm payment
const confirmPayment = catchAsync(async (req: any, res : any) => {
  const result = await PaymentService.confirmPayment(req.user.id, req.body.paymentIntentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment confirmed successfully',
    data: result,
  });
});

// Get payment history
const getPaymentHistory = catchAsync(async (req: any, res : any) => {
  const result = await PaymentService.getPaymentHistory(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment history fetched successfully',
    data: result,
  });
});

// Get payment by ID
const getPaymentById = catchAsync(async (req: any, res : any) => {
  const result = await PaymentService.getPaymentById(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment details fetched successfully',
    data: result,
  });
});

// Handle Stripe webhook
const handleWebhook = catchAsync(async (req: any, res : any) => {
  const signature = req.headers['stripe-signature'] as string;
  const result = await PaymentService.handleWebhook(signature, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Webhook processed successfully',
    data: result,
  });
});

export const PaymentController = {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentById,
  handleWebhook,
};