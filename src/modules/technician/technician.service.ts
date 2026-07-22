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
        dayOfWeek: slot.dayOfWeek,
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

export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
  getMyProfile,
  updateProfile,
  updateAvailability,
};