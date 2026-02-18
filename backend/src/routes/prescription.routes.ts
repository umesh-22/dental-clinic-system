import { Router } from 'express';
import * as prescriptionController from '../controllers/prescription.controller';
import { authenticate } from '../middleware/auth';
import { generatePrescriptionPDF } from '../utils/pdf';
import * as prescriptionService from '../services/prescription.service';
import fs from 'fs';

const router = Router();

router.use(authenticate);

router.post('/', prescriptionController.createPrescription);
router.get('/', prescriptionController.getPrescriptions);
router.get('/:id', prescriptionController.getPrescriptionById);
router.put('/:id', prescriptionController.updatePrescription);
router.delete('/:id', prescriptionController.deletePrescription);

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id);
    const pdfPath = await generatePrescriptionPDF(prescription);
    
    res.download(pdfPath, `prescription-${prescription.id}.pdf`, (err) => {
      if (err) {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        if (!res.headersSent) {
          next(err);
        }
      } else {
        setTimeout(() => {
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
          }
        }, 5000);
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
