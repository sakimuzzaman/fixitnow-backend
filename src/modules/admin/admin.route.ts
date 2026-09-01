import express from 'express';
import auth from '../../middlewares/auth.js';
import { AdminController } from './admin.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { CategoryValidation } from '../category/category.validation.js';


const router = express.Router();
// router.get('/users', auth('ADMIN'), AdminController.getAllUsers);
// router.patch('/users/:id', auth('ADMIN'), AdminController.updateUserStatus);
// router.get('/bookings', auth('ADMIN'), AdminController.getAllBookings);
// We can reuse Category routes or create specific Admin routes

router.get(
  '/users',
  auth('ADMIN'),
  AdminController.getAllUsers
);

router.patch(
  '/users/:id',
  auth('ADMIN'),
  AdminController.updateUserStatus
);

router.get(
  '/bookings',
  auth('ADMIN'),
  AdminController.getAllBookings
);

router.get(
  '/categories',
  auth('ADMIN'),
  AdminController.getAllCategories
);

router.post(
  '/categories',
  auth('ADMIN'),
  validateRequest(CategoryValidation.createCategory),
  AdminController.createCategory
);

router.patch(
  '/categories/:id',
  auth('ADMIN'),
   validateRequest(CategoryValidation.updateCategory),
  AdminController.updateCategory
);

router.delete(
  '/categories/:id',
  auth('ADMIN'),
  AdminController.deleteCategory
);

export const AdminRoutes = router;