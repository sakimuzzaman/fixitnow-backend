import express from 'express';
import { TechnicianController } from './technician.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { TechnicianValidation } from './technician.validation.js';
import auth from '../../middlewares/auth.js';


const router = express.Router();



router.get('/', TechnicianController.getAllTechnicians);
router.get('/:id', TechnicianController.getTechnicianById);



router.get('/profile/me', auth('TECHNICIAN'), TechnicianController.getMyProfile);

router.put(
  '/profile',
  auth('TECHNICIAN'),
  validateRequest(TechnicianValidation.updateProfile),
  TechnicianController.updateProfile
);

router.put(
  '/availability',
  auth('TECHNICIAN'),
  validateRequest(TechnicianValidation.updateAvailability),
  TechnicianController.updateAvailability
);

export const TechnicianRoutes = router;