import express from 'express';
import { AuthValidation } from './auth.validation.js';
import validateRequest from '../../middlewares/validateRequest.js';
import auth from '../../middlewares/auth.js';
import { AuthController } from './auth.controller.js';

const router = express.Router();

router.post(
  '/register',
  validateRequest(AuthValidation.register),
  AuthController.register
);

router.post(
  '/login',
  validateRequest(AuthValidation.login),
  AuthController.login
);

router.get('/me', auth(), AuthController.getMe);

export const AuthRoutes = router;