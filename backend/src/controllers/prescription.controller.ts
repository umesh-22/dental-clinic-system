import { Request, Response, NextFunction } from 'express';
import * as prescriptionService from '../services/prescription.service';

export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await prescriptionService.createPrescription(req.body);
    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const patientId = req.query.patientId as string;
    const doctorId = req.query.doctorId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const result = await prescriptionService.getPrescriptions(patientId, doctorId, startDate, endDate, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id);
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await prescriptionService.updatePrescription(req.params.id, req.body);
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

export const deletePrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prescriptionService.deletePrescription(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
