import express from 'express';
import { PaymentController } from './payment.controller.js';
import { PaymentValidation } from './payment.validation.js';
import validateRequest from '../../middlewares/validateRequest.js';
import auth from '../../middlewares/auth.js';


const router = express.Router();

// Create payment intent (Customer)
router.post(
  '/create',
  auth('CUSTOMER'),
  validateRequest(PaymentValidation.createPayment),
  PaymentController.createPaymentIntent
);

// Confirm payment (Customer)
router.post(
  '/confirm',
  auth('CUSTOMER'),
  validateRequest(PaymentValidation.confirmPayment),
  PaymentController.confirmPayment
);

// Get payment history (Customer)
router.get('/', auth('CUSTOMER'), PaymentController.getPaymentHistory);

// Get payment by ID (Customer)
router.get('/:id', auth('CUSTOMER'), PaymentController.getPaymentById);

// Stripe webhook (Public - Stripe calls this)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

export const PaymentRoutes = router;