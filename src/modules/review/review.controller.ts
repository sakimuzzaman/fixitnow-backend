import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ReviewService } from './review.service.js';

const createReview = catchAsync(async (req: any, res: any) => {
  const result = await ReviewService.createReview(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

export const ReviewController = { createReview };