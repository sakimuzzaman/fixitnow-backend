
import { StatusCodes as httpStatus } from 'http-status-codes';

import prisma from "../../shared/prisma.js";
import AppError from '../../utils/AppError.js';


//newly added
const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


const updateUserStatus = async (
  id: string,
  status: "ACTIVE" | "BANNED"
) => {
  return prisma.user.update({
    where: { id },
    data: { status },
  });
};

const getAllBookings = async () => {
  return prisma.booking.findMany({
    include: {
      customer: true,
      technicianProfile: true,
      service: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};


const createCategory = async (payload: {
  name: string;
  description?: string;
  icon?: string;
}) => {
  const existing = await prisma.category.findUnique({
    where: {
      name: payload.name,
    },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Category already exists"
    );
  }

  return prisma.category.create({
    data: payload,
  });
};


const updateCategory = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
  }
) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Category not found"
    );
  }

  if (payload.name) {
    const existing = await prisma.category.findFirst({
      where: {
        name: payload.name,
        NOT: {
          id,
        },
      },
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Category name already exists"
      );
    }
  }

  return prisma.category.update({
    where: { id },
    data: payload,
  });
};

const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      services: true,
    },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Category not found"
    );
  }

  if (category.services.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete a category that has services"
    );
  }

  await prisma.category.delete({
    where: { id },
  });
};


export const AdminService = {   getAllUsers,
                                updateUserStatus, 
                                getAllBookings, 
                                getAllCategories,
                                createCategory,
                                updateCategory,
                                deleteCategory,  
                            };