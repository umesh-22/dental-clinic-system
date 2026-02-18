import { Request, Response, NextFunction } from 'express';
import * as treatmentService from '../services/treatment.service';

export const createTreatment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const treatment = await treatmentService.createTreatment({
      ...req.body,
      treatmentDate: req.body.treatmentDate ? new Date(req.body.treatmentDate) : undefined,
    });
    res.status(201).json({ success: true, data: treatment });
  } catch (error) {
    next(error);
  }
};

export const getTreatments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const patientId = req.query.patientId as string;
    const doctorId = req.query.doctorId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const result = await treatmentService.getTreatments(patientId, doctorId, startDate, endDate, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getTreatmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const treatment = await treatmentService.getTreatmentById(req.params.id);
    res.json({ success: true, data: treatment });
  } catch (error) {
    next(error);
  }
};

export const updateTreatment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = { ...req.body };
    if (data.treatmentDate) data.treatmentDate = new Date(data.treatmentDate);
    
    const treatment = await treatmentService.updateTreatment(req.params.id, data);
    res.json({ success: true, data: treatment });
  } catch (error) {
    next(error);
  }
};

export const deleteTreatment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await treatmentService.deleteTreatment(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
