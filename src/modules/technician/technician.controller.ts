import httpStatus from 'http-status';
import sendResponse from '../../utils/sendResponse.js';
import { TechnicianService } from './technician.service.js';
import catchAsync from '../../utils/catchAsync.js';



const getAllTechnicians = catchAsync(async (req : any, res : any) => {
  const result = await TechnicianService.getAllTechnicians(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technicians fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getTechnicianById = catchAsync(async (req : any, res : any) => {
  const result = await TechnicianService.getTechnicianById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician profile fetched successfully',
    data: result,
  });
});

// TECHNICIAN
const getMyProfile = catchAsync(async (req : any, res : any) => {
  const result = await TechnicianService.getMyProfile(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req : any, res : any) => {
  const result = await TechnicianService.updateProfile(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const updateAvailability = catchAsync(async (req : any, res : any) => {
  const result = await TechnicianService.updateAvailability(
    req.user.id,
    req.body.slots
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Availability updated successfully',
    data: result,
  });
});

export const TechnicianController = {
  getAllTechnicians,
  getTechnicianById,
  getMyProfile,
  updateProfile,
  updateAvailability,
};