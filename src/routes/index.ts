import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { CategoryRoutes } from '../modules/category/category.route.js';
import { ServiceRoutes } from '../modules/service/service.route.js';
import { TechnicianRoutes } from '../modules/technician/technician.route.js';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;