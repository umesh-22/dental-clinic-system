import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const stats = await reportService.getDashboardStats(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    
    const report = await reportService.getRevenueReport(startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const getPatientAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    
    const analytics = await reportService.getPatientAnalytics(startDate, endDate);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

export const getDoctorPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    
    const performance = await reportService.getDoctorPerformance(startDate, endDate);
    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};
