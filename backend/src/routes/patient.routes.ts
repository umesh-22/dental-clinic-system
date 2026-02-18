import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', patientController.createPatient);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

export default router;
