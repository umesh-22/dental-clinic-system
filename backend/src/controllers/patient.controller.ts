import { Request, Response, NextFunction } from 'express';
import * as patientService from '../services/patient.service';
import { AppError } from '../utils/errors';

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.createPatient(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const result = await patientService.getPatients(page, limit, search);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await patientService.deletePatient(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
