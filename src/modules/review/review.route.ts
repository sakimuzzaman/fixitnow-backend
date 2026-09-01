import express from 'express';
import auth from '../../middlewares/auth.js';
import { ReviewValidation } from './review.validation.js';
import { ReviewController } from './review.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';

const router = express.Router();


// router.post('/', auth('CUSTOMER'), validateRequest(ReviewValidation.createReview), ReviewController.createReview);


// router.post(
//   "/:id/reviews",
//   auth("CUSTOMER"),
//   validateRequest(ReviewValidation.createReview),
//   ReviewController.createReview
// );

export const ReviewRoutes = router;