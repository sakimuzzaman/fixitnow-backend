import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ServiceService } from './service.service.js';

const createService = catchAsync(async (req: any, res : any) => {
  const result = await ServiceService.createService(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

const getTechnicianServices = catchAsync(async (req: any, res : any) => {
  const result = await ServiceService.getTechnicianServices(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician services fetched successfully',
    data: result,
  });
});

const updateService = catchAsync(async (req: any, res : any) => {
  const result = await ServiceService.updateService(
    req.user.id,
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req: any, res : any) => {
  await ServiceService.deleteService(req.user.id, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Service deleted successfully',
    data: null,
  });
});

const getAllServices = catchAsync(async (req : any, res : any) => {
  const result = await ServiceService.getAllServices(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Services fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const ServiceController = {
  createService,
  getTechnicianServices,
  updateService,
  deleteService,
  getAllServices,
};