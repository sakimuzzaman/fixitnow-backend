import express from 'express';
import { BookingController } from './booking.controller.js';
import { BookingValidation } from './booking.validation.js';
import validateRequest from '../../middlewares/validateRequest.js';
import auth from '../../middlewares/auth.js';


const router = express.Router();

// Create booking (Customer)
router.post(
  '/',
  auth('CUSTOMER'),
  validateRequest(BookingValidation.createBooking),
  BookingController.createBooking
);

// Get my bookings (Customer)
router.get('/', auth('CUSTOMER'), BookingController.getMyBookings);

// Get booking by ID
router.get('/:id', auth('CUSTOMER', 'TECHNICIAN', 'ADMIN'), BookingController.getBookingById);

// Technician bookings
router.get('/technician/bookings', auth('TECHNICIAN'), BookingController.getTechnicianBookings);

// Update booking status (Technician)
router.patch(
  '/:id/status',
  auth('TECHNICIAN'),
  validateRequest(BookingValidation.updateBookingStatus),
  BookingController.updateBookingStatus
);

// Cancel booking (Customer)
router.patch(
  '/:id/cancel',
  auth('CUSTOMER'),
  BookingController.cancelBooking
);

export const BookingRoutes = router;