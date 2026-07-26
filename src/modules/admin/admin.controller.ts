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

export const AdminController = { getAllUsers, updateUserStatus, getAllBookings };