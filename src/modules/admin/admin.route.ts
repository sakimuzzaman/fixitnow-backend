import express from 'express';
import auth from '../../middlewares/auth.js';
import { AdminController } from './admin.controller.js';


const router = express.Router();
router.get('/users', auth('ADMIN'), AdminController.getAllUsers);
router.patch('/users/:id', auth('ADMIN'), AdminController.updateUserStatus);
router.get('/bookings', auth('ADMIN'), AdminController.getAllBookings);
// We can reuse Category routes or create specific Admin routes
export const AdminRoutes = router;