import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { CategoryController } from './category.controller.js';
import { CategoryValidation } from './category.valodation.js';

const router = express.Router();

// Public route
router.get('/', CategoryController.getAllCategories);

// Admin only routes
router.post(
  '/',
  auth('ADMIN'),
  validateRequest(CategoryValidation.createCategory),
  CategoryController.createCategory
);

export const CategoryRoutes = router;