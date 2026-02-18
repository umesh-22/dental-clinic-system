import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/revenue', reportController.getRevenueReport);
router.get('/patients', reportController.getPatientAnalytics);
router.get('/doctors', reportController.getDoctorPerformance);

export default router;
