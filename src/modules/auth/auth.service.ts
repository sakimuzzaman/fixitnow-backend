import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { StringValue } from "ms";
import { ILoginPayload, IRegisterPayload } from './auth.interface.js';
import AppError from '../../utils/AppError.js';
import prisma from '../../shared/prisma.js';
import config from '../../config/index.js';


const register = async (payload: IRegisterPayload) => {
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (isUserExist) {
    throw new AppError(httpStatus.CONFLICT, 'Email already registered');
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt.saltRounds
  );

  // Transactional: create user + (if technician) empty profile
  const result = await prisma.$transaction(async (tx : any) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        phone: payload.phone,
        location: payload.location,
      },
    });

    if (payload.role === 'TECHNICIAN') {
      await tx.technicianProfile.create({
        data: { userId: user.id },
      });
    }

    return user;
  });

  const { password, ...userWithoutPassword } = result;
  return userWithoutPassword;
};

const login = async (payload: ILoginPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }
  if (user.status === 'BANNED') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account has been banned');
  }

  const isPasswordCorrect = await bcrypt.compare(
    payload.password,
    user.password
  );
  if (!isPasswordCorrect) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn as StringValue,
    }
  );

  const { password, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { technicianProfile: true },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const AuthService = { register, login, getMe };