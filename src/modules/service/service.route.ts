import express from 'express';
import auth from '../../middlewares/auth.js';
import { ServiceController } from './service.controller.js';
import { ServiceValidation } from './service.validation.js';
import validateRequest from '../../middlewares/validateRequest.js';

const router = express.Router();

// Public route
router.get('/', ServiceController.getAllServices);

// Technician routes
router.post(
  '/',
  auth('TECHNICIAN'),
  validateRequest(ServiceValidation.createService),
  ServiceController.createService
);

router.get(
  '/my-services',
  auth('TECHNICIAN'),
  ServiceController.getTechnicianServices
);

router.patch(
  '/:id',
  auth('TECHNICIAN'),
  validateRequest(ServiceValidation.updateService),
  ServiceController.updateService
);

router.delete(
  '/:id',
  auth('TECHNICIAN'),
  ServiceController.deleteService
);

export const ServiceRoutes = router;