import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import httpStatus from 'http-status';
import { AdminService } from './admin.service.js';

const getAllUsers = catchAsync(async (req : any, res : any) => {
    const result = await AdminService.getAllUsers();
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Users fetched", data: result });
});

const updateUserStatus = catchAsync(async (req : any, res : any) => {
    const result = await AdminService.updateUserStatus(req.params.id, req.body.status);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "User status updated", data: result });
});

const getAllBookings = catchAsync(async (req : any, res : any) => {
    const result = await AdminService.getAllBookings();
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Bookings fetched", data: result });
});

// added newly 
const getAllCategories = catchAsync(async (req: any, res: any) => {
  const result = await AdminService.getAllCategories();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result,
  });
});

const createCategory = catchAsync(async (req: any, res: any) => {
  const result = await AdminService.createCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: any, res: any) => {
  const result = await AdminService.updateCategory(
    req.params.id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: any, res: any) => {
  await AdminService.deleteCategory(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: null,
  });
});

export const AdminController = {  getAllUsers, 
                                  updateUserStatus, 
                                  getAllBookings, 
                                  getAllCategories, 
                                  createCategory, 
                                  updateCategory, 
                                  deleteCategory 
                                };