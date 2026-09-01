import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import AppError from '../../utils/AppError.js';
import prisma from '../../shared/prisma.js';




const getAllTechnicians = async (filters: any) => {
  const {
    location,
    minRating,
    maxPrice,
    skill,
    category,
    search,
    page = 1,
    limit = 10,
  } = filters;

  const where: Prisma.TechnicianProfileWhereInput = {};

  if (minRating) {
    where.ratingAvg = { gte: Number(minRating) };
  }

  if (maxPrice) {
    where.hourlyRate = { lte: Number(maxPrice) };
  }

  if (skill) {
    where.skills = { has: skill };
  }

  if (location) {
    where.user = {
      location: { contains: location, mode: 'insensitive' },
    };
  }

  if (category) {
    where.services = {
      some: {
        category: { name: { equals: category, mode: 'insensitive' } },
        isActive: true,
      },
    };
  }

  if (search) {
    where.OR = [
      { bio: { contains: search, mode: 'insensitive' } },
      { skills: { has: search } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [technicians, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatar: true,
          },
        },
        services: {
          where: { isActive: true },
          include: { category: true },
        },
      },
      orderBy: { ratingAvg: 'desc' },
    }),
    prisma.technicianProfile.count({ where }),
  ]);

  return {
    data: technicians,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};




const getTechnicianById = async (id: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
          createdAt: true,
        },
      },
      services: {
        where: { isActive: true },
        include: { category: true },
      },
      availabilities: true,
      reviews: {
        include: {
          customer: {
            select: { name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician not found');
  }

  return technician;
};




const getMyProfile = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
          avatar: true,
        },
      },
      services: {
        include: { category: true },
      },
      availabilities: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
          services: true,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  return profile;
};





const updateProfile = async (userId: string, payload: any) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { userId },
    data: {
      bio: payload.bio,
      experienceYears: payload.experienceYears,
      skills: payload.skills,
      hourlyRate: payload.hourlyRate,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          location: true,
        },
      },
    },
  });

  return updatedProfile;
};





const updateAvailability = async (userId: string, slots: any[]) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  // Validate: startTime must be before endTime
  for (const slot of slots) {
    if (slot.startTime >= slot.endTime) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Start time must be before end time for ${slot.dayOfWeek}`
      );
    }
  }

  // Delete old slots and insert new ones in a transaction
  const result = await prisma.$transaction(async (tx : any) => {
    await tx.technicianAvailability.deleteMany({
      where: { technicianProfileId: profile.id },
    });

    const createdSlots = await tx.technicianAvailability.createMany({
      data: slots.map((slot) => ({
        technicianProfileId: profile.id,
        // dayOfWeek: slot.dayOfWeek,
        dayOfWeek: String(slot.dayOfWeek).trim().toUpperCase(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable,
      })),
    });

    const allSlots = await tx.technicianAvailability.findMany({
      where: { technicianProfileId: profile.id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return allSlots;
  });

  return result;
};

//newly added


const getTechnicianAvailability = async (technicianId: string) => {

  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id: technicianId,
    },
    include: {
      availabilities: true,
    },
  });

  if (!technician) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Technician not found"
    );
  }

  const availabilities = technician.availabilities.filter(
    (slot) => slot.isAvailable
  );
  console.log("ACTIVE AVAILABILITIES:", availabilities);

  const bookings = await prisma.booking.findMany({
    where: {
      technicianProfileId: technicianId,
      status: {
        in: [
          "REQUESTED",
          "ACCEPTED",
          "PAID",
          "IN_PROGRESS",
        ],
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

  const dayNames = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const result: {
    date: string;
    slots: {
      time: string;
      isBooked: boolean;
    }[];
  }[] = [];

  /*
   * Get today's date in Bangladesh.
   */
  const today = new Date();

  const todayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayString = todayFormatter.format(today);

  const [todayYear, todayMonth, todayDay] =
    todayString.split("-").map(Number);

  /*
   * Create each calendar date in Bangladesh.
   */
  for (let i = 0; i < 14; i++) {
    const calendarDate = new Date(
      Date.UTC(
        todayYear,
        todayMonth - 1,
        todayDay + i
      )
    );

    const dateString = `${calendarDate.getUTCFullYear()}-${String(
      calendarDate.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(
      calendarDate.getUTCDate()
    ).padStart(2, "0")}`;

    const dateWithBdTimezone = new Date(
      `${dateString}T12:00:00+06:00`
    );

    const weekdayFormatter = new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Dhaka",
        weekday: "long",
      }
    );

    const dayOfWeek = weekdayFormatter
      .format(dateWithBdTimezone)
      .toUpperCase();

    const dayAvailability = availabilities.find(
      (slot) => slot.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability) {
      continue;
    }

    const [startHour, startMinute] =
      dayAvailability.startTime
        .split(":")
        .map(Number);

    const [endHour, endMinute] =
      dayAvailability.endTime
        .split(":")
        .map(Number);

    const startMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    const slots: {
      time: string;
      isBooked: boolean;
    }[] = [];

    for (
      let minutes = startMinutes;
      minutes < endMinutes;
      minutes += 60
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;

      const time = `${String(hour).padStart(
        2,
        "0"
      )}:${String(minute).padStart(2, "0")}`;

      /*
       * This is the real timestamp for the booking.
       *
       * Example:
       * 2026-08-21 + 10:00 Bangladesh
       * becomes
       * 2026-08-21T04:00:00.000Z
       */
      const slotDate = new Date(
        `${dateString}T${time}:00+06:00`
      );

      const slotEnd = new Date(
        slotDate.getTime() +
          60 * 60 * 1000
      );

      const isBooked = bookings.some((booking) => {
        const bookingStart = booking.scheduledAt;

        const bookingEnd = new Date(
          bookingStart.getTime() +
            booking.service.duration * 60 * 1000
        );

        return (
          slotDate < bookingEnd &&
          slotEnd > bookingStart
        );
      });

      slots.push({
        time,
        isBooked,
      });
    }

    result.push({
      date: dateString,
      slots,
    });
  }

  return result;
};


const getMyAvailability = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: {
      userId,
    },
    select: {
      availabilities: {
        orderBy: {
          dayOfWeek: "asc",
        },
      },
    },
  });

  if (!profile) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Technician profile not found"
    );
  }

  return profile.availabilities;
};


export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
  getMyProfile,
  updateProfile,
  updateAvailability,
  getTechnicianAvailability,
  getMyAvailability
};