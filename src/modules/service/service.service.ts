import httpStatus from 'http-status';
import { Prisma } from '@prisma/client';
import AppError from '../../utils/AppError.js';
import prisma from '../../shared/prisma.js';

const createService = async (userId: string, payload: any) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const service = await prisma.service.create({
    data: {
      ...payload,
      technicianProfileId: technicianProfile.id,
    },
    include: {
      category: true,
      technicianProfile: {
        include: { user: { select: { name: true, email: true, avatar: true } } },
      },
    },
  });

  return service;
};

const getTechnicianServices = async (userId: string) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  const services = await prisma.service.findMany({
    where: { technicianProfileId: technicianProfile.id },
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return services;
};

const updateService = async (userId: string, serviceId: string, payload: any) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  if (service.technicianProfileId !== technicianProfile.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this service');
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: payload,
    include: {
      category: true,
    },
  });

  return updatedService;
};

const deleteService = async (userId: string, serviceId: string) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, 'Technician profile not found');
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  if (service.technicianProfileId !== technicianProfile.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to delete this service');
  }

  await prisma.service.delete({ where: { id: serviceId } });
  return null;
};

const getAllServices = async (filters: any) => {
  const { category, location, minPrice, maxPrice, rating, search, page = 1, limit = 10 } = filters;

  const where: Prisma.ServiceWhereInput = {
    isActive: true,
  };

  if (category) {
    where.category = { name: { equals: category, mode: 'insensitive' } };
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (rating) {
    where.technicianProfile = {
      ratingAvg: { gte: Number(rating) },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        category: true,
        technicianProfile: {
          include: {
            user: {
              select: { name: true, email: true, avatar: true, location: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  return {
    data: services,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const ServiceService = {
  createService,
  getTechnicianServices,
  updateService,
  deleteService,
  getAllServices,
};