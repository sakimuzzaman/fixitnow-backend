import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { BookingService } from './booking.service.js';

// Create booking (Customer)
const createBooking = catchAsync(async (req: any, res : any) => {
  const result = await BookingService.createBooking(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

// Get my bookings (Customer)
const getMyBookings = catchAsync(async (req: any, res : any) => {
  const result = await BookingService.getMyBookings(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings fetched successfully',
    data: result,
  });
});

// Get booking by ID
const getBookingById = catchAsync(async (req: any, res : any) => {
  const result = await BookingService.getBookingById(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking details fetched successfully',
    data: result,
  });
});

// Get technician bookings
const getTechnicianBookings = catchAsync(async (req: any, res : any) => {
  const result = await BookingService.getTechnicianBookings(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings fetched successfully',
    data: result,
  });
});

// Update booking status (Technician)
const updateBookingStatus = catchAsync(async (req: any, res : any) => {
  const { status, note } = req.body;
  const result = await BookingService.updateBookingStatus(req.user.id, req.params.id, status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking status updated successfully',
    data: result,
  });
});

// Cancel booking (Customer)
const cancelBooking = catchAsync(async (req: any, res : any) => {
  const result = await BookingService.cancelBooking(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getMyBookings,
  getBookingById,
  getTechnicianBookings,
  updateBookingStatus,
  cancelBooking,
};