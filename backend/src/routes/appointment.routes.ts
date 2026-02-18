import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', appointmentController.updateAppointment);
router.post('/:id/check-in', appointmentController.checkIn);
router.post('/:id/check-out', appointmentController.checkOut);
router.post('/:id/cancel', appointmentController.cancelAppointment);

export default router;
