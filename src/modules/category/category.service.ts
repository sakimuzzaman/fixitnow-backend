import httpStatus from 'http-status';
import prisma from '../../shared/prisma.js';
import AppError from '../../utils/AppError.js';

const createCategory = async (payload: {
  name: string;
  description?: string;
  icon?: string;
}) => {
  const isExist = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (isExist) {
    throw new AppError(httpStatus.CONFLICT, 'Category already exists');
  }

  const category = await prisma.category.create({
    data: payload,
  });

  return category;
};

const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return categories;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
};