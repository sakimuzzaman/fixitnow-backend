import httpStatus from 'http-status';
import prisma from '../../shared/prisma.js';
import AppError from '../../utils/AppError.js';



const createBooking = async (userId: string, payload: any) => {
    // 1. Validate customer
    const customer = await prisma.user.findUnique({
      where: { id: userId },
    });
  
    if (!customer || customer.role !== 'CUSTOMER') {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only customers can book services'
      );
    }
  
    // 2. Validate service
    const service = await prisma.service.findUnique({
      where: {
        id: payload.serviceId,
      },
      include: {
        technicianProfile: true,
      },
    });
  
    if (!service) {
      throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
    }
  
    if (!service.isActive) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Service is no longer available'
      );
    }
  
    // 3. Validate technician availability
    const scheduledDate = new Date(payload.scheduledAt);
  
    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][scheduledDate.getDay()];
  
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
  
    const [startHour, startMinute] = availability.startTime
      .split(':')
      .map(Number);
  
    const [endHour, endMinute] = availability.endTime
      .split(':')
      .map(Number);
  
    const bookingMinutes =
      scheduledDate.getHours() * 60 + scheduledDate.getMinutes();
  
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
  
    if (
      bookingMinutes < startMinutes ||
      bookingMinutes >= endMinutes
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Technician is only available from ${availability.startTime} to ${availability.endTime} on ${dayOfWeek}`
      );
    }
  
    // 4. Booking overlap check
    const bookingStart = scheduledDate;
    const bookingEnd = new Date(
      bookingStart.getTime() + service.duration * 60000
    );
  
    const existingBookings = await prisma.booking.findMany({
      where: {
        technicianProfileId: service.technicianProfileId,
        status: {
          in: ['REQUESTED', 'ACCEPTED', 'PAID', 'IN_PROGRESS'],
        },
      },
      include: {
        service: {
          select: {
            duration: true,
          },
        },
      },
    });
  
    const hasConflict = existingBookings.some((existing) => {
      const existingStart = existing.scheduledAt;
  
      const existingEnd = new Date(
        existingStart.getTime() +
          existing.service.duration * 60000
      );
  
      return (
        bookingStart < existingEnd &&
        bookingEnd > existingStart
      );
    });
  
    if (hasConflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Technician already has a booking during this time.'
      );
    }
  
    // 5. Create booking
    const booking = await prisma.$transaction(async (tx) => {
      return await tx.booking.create({
        data: {
          customerId: userId,
          technicianProfileId: service.technicianProfileId,
          serviceId: service.id,
          scheduledAt: bookingStart,
          address: payload.address,
          notes: payload.notes,
          totalAmount: service.price,
          status: 'REQUESTED',
        },
        include: {
          service: {
            include: {
              category: true,
            },
          },
          technicianProfile: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  location: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });
    });
  
    return booking;
  };

// createdAt : 
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


// Find technician profile (if user is a technician)
const technicianProfile = await prisma.technicianProfile.findUnique({
    where: {
      userId,
    },
  });
  
  const technicianProfileId = technicianProfile?.id;
  
  if (
    booking.customerId !== userId &&
    booking.technicianProfileId !== technicianProfileId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Unauthorized access'
    );
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
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Technician profile not found'
      );
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
  
    // Ensure the booking belongs to this technician
    if (booking.technicianProfileId !== technicianProfile.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You can only update your own bookings'
      );
    }
  
    const currentStatus = booking.status;
    const newStatus = status as any;
  
    const allowedTransitions: Record<string, string[]> = {
      REQUESTED: ['ACCEPTED', 'DECLINED'],
      ACCEPTED: ['PAID'],
      PAID: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      DECLINED: [],
      CANCELLED: [],
      COMPLETED: [],
    };
  
    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions[currentStatus]?.join(', ')}`
      );
    }
  
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
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