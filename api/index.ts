import express from 'express';
import { AuthRoutes } from '../src/modules/auth/auth.route.js';
import { CategoryRoutes } from '../src/modules/category/category.route.js';
import { ServiceRoutes } from '../src/modules/service/service.route.js';
import { TechnicianRoutes } from '../src/modules/technician/technician.route.js';
import { BookingRoutes } from '../src/modules/booking/booking.route.js';
import { PaymentRoutes } from '../src/modules/payment/payment.route.js';
import { ReviewRoutes } from '../src/modules/review/review.route.js';
import { AdminRoutes } from '../src/modules/admin/admin.route.js';
import app from '../src/app.js';


const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/services',
    route: ServiceRoutes,
  },
  {
    path: '/technicians',
    route: TechnicianRoutes,
  },
  {
    path: '/technician',
    route: TechnicianRoutes,
  },
  { path: '/bookings', 
    route: BookingRoutes 
  },
  { 
    path: '/payments', 
    route: PaymentRoutes 
  },
  { path: '/reviews',
    route: ReviewRoutes 
  },
  { path: '/admin',
    route: AdminRoutes 
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default app;