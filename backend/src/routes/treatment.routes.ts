import { Router } from 'express';
import * as treatmentController from '../controllers/treatment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', treatmentController.createTreatment);
router.get('/', treatmentController.getTreatments);
router.get('/:id', treatmentController.getTreatmentById);
router.put('/:id', treatmentController.updateTreatment);
router.delete('/:id', treatmentController.deleteTreatment);

export default router;
