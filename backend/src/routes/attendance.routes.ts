import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/', attendanceController.getAttendance);
router.put('/:userId/:date', attendanceController.updateAttendance);

export default router;
