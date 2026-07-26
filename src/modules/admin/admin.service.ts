import prisma from "../../shared/prisma.js";


const getAllUsers = async () => await prisma.user.findMany({ include: { technicianProfile: true } });

const updateUserStatus = async (id: string, status: 'ACTIVE' | 'BANNED') => {
  return await prisma.user.update({ where: { id }, data: { status } });
};

const getAllBookings = async () => await prisma.booking.findMany({ include: { customer: true, technicianProfile: true } });

const getAllCategories = async () => await prisma.category.findMany();

export const AdminService = { getAllUsers, updateUserStatus, getAllBookings, getAllCategories };