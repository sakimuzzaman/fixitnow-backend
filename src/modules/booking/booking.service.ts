import httpStatus from 'http-status';
import prisma from '../../shared/prisma.js';
import AppError from '../../utils/AppError.js';





const createBooking = async (userId: string, payload: any) => {
  // 1. Validate customer role
  const customer = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!customer || customer.role !== 'CUSTOMER') {
    throw new AppError(httpStatus.FORBIDDEN, 'Only customers can book services');
  }

  // 2. Validate service exists
  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
    include: {
      technicianProfile: true,
    },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  if (!service.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Service is no longer available');
  }

  // 3. Validate technician availability
  const scheduledDate = new Date(payload.scheduledAt);
  const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][scheduledDate.getDay()];

  const availability = await prisma.technicianAvailability.findFirst({
    where: {
      technicianProfileId: service.technicianProfileId,
      dayOfWeek,
      isAvailable: true,
    },
  });

  if (!availability) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Technician is not available on ${dayOfWeek}`
    );
  }

  const [startHour, startMin] = availability.startTime.split(':').map(Number);
  const [endHour, endMin] = availability.endTime.split(':').map(Number);

  const scheduledTimeInMinutes = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
  const slotStartInMinutes = startHour * 60 + startMin;
  const slotEndInMinutes = endHour * 60 + endMin;

  if (scheduledTimeInMinutes < slotStartInMinutes || scheduledTimeInMinutes >= slotEndInMinutes) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Technician is only available from ${availability.startTime} to ${availability.endTime} on ${dayOfWeek}`
    );
  }

  // 4. Check for booking conflicts
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      technicianProfileId: service.technicianProfileId,
      status: { in: ['REQUESTED', 'ACCEPTED'] },
      scheduledAt: {
        gte: scheduledDate,
        lte: new Date(scheduledDate.getTime() + service.duration * 60000),
      },
    },
  });

  if (conflictingBooking) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Technician has another booking at this time'
    );
  }

  // 5. Create booking in transaction
  const booking = await prisma.$transaction(async (tx : any) => {
    const createdBooking = await tx.booking.create({
      data: {
        customerId: userId,
        technicianProfileId: service.technicianProfileId,
        serviceId: service.id,
        scheduledAt: scheduledDate,
        address: payload.address,
        notes: payload.notes,
        totalAmount: service.price,
        status: 'REQUESTED',
      },
      include: {
        service: { include: { category: true } },
        technicianProfile: {
          include: { user: { select: { name: true, email: true, location: true } } },
        },
        customer: { select: { name: true, phone: true } },
      },
    });

    // Increment pending bookings count
    await tx.technicianProfile.update({
      where: { id: service.technicianProfileId },
      data: {
        _count: { connect: { bookings: { id: createdBooking.id } } },
      },
    });

    return createdBooking;
  });

  return booking;
};


// createdAt : true
const getMyBookings = async (userId: string) => {
  const bookings = await prisma.booking.findMany({
    where: {
      customerId: userId,
    },
    include: {
      service: {
        include: {
          category: true,
          technicianProfile: {
            include: { user: { select: { name: true, email: true, avatar: true } } },
          },
        },
      },
      payment: true,
      
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};




const getBookingById = async (userId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        include: {
          category: true,
          technicianProfile: {
            include: { user: { select: { name: true, email: true, avatar: true } } },
          },
        },
      },
      technicianProfile: {
        include: { user: { select: { name: true, email: true, location: true } } },
      },
      customer: { select: { name: true, phone: true, email: true } },
      payment: true,
      review: true,
    },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (
    booking.customerId !== userId &&
    booking.technicianProfileId !== userId &&
    !['ADMIN'].includes('ADMIN') // Admin check would be added later
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'Unauthorized access');
  }

  return booking;
};


const getTechnicianBookings = async (userId: string) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  const bookings = await prisma.booking.findMany({
    where: {
      technicianProfileId: technicianProfile.id,
    },
    include: {
      service: {
        include: {
          category: true,
        },
      },
      customer: {
        select: { name: true, phone: true, email: true, avatar: true },
      },
      payment: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings;
};




const updateBookingStatus = async (
  userId: string,
  bookingId: string,
  status: string
) => {
  // Get technician profile
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  // Get booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.technicianProfileId !== technicianProfile.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only update your own bookings');
  }

  // Status transition rules
  const currentStatus = booking.status;
  let newStatus = status as any;

  const allowedTransitions: Record<string, string[]> = {
    REQUESTED: ['ACCEPTED', 'DECLINED'],
    ACCEPTED: ['PAID'],
    PAID: ['IN_PROGRESS'],
    IN_PROGRESS: ['COMPLETED'],
    CANCELLED: [],
    COMPLETED: [],
  };

  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions[currentStatus]?.join(', ')}`
    );
  }

  // Transactional update
  const updatedBooking = await prisma.$transaction(async (tx : any) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        service: { include: { category: true } },
        customer: { select: { name: true, email: true, phone: true } },
        payment: true,
      },
    });

    // If completed, allow review creation flag
    if (newStatus === 'COMPLETED') {
      await tx.technicianProfile.update({
        where: { id: technicianProfile.id },
        data: {
          _count: { disconnect: { reviews: { id: { contains: bookingId } } } },
        },
      });
    }

    return booking;
  });

  return updatedBooking;
};


const cancelBooking = async (userId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.customerId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only cancel your own bookings');
  }

  // Can only cancel before IN_PROGRESS
  const allowedCancelStatuses = ['REQUESTED', 'ACCEPTED', 'PAID'];
  if (!allowedCancelStatuses.includes(booking.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel booking. Status: ${booking.status}. Only REQUESTED, ACCEPTED, or PAID can be cancelled.`
    );
  }

  // Refund if already paid
  if (booking.payment?.status === 'COMPLETED') {
    // Note: In production, integrate refund API here
    // For now, we just mark payment for tracking
  }

  const cancelledBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
    include: {
      service: { include: { category: true } },
      technicianProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return cancelledBooking;
};

export const BookingService = {
  createBooking,
  getMyBookings,
  getBookingById,
  getTechnicianBookings,
  updateBookingStatus,
  cancelBooking,
};