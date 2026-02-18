import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.createPayment({
      ...req.body,
      paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const invoiceId = req.query.invoiceId as string;
    const patientId = req.query.patientId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const method = req.query.method as any;
    
    const result = await paymentService.getPayments(invoiceId, patientId, startDate, endDate, method, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};
