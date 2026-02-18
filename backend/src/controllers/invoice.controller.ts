import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoice.service';
import { generateInvoicePDF } from '../utils/pdf';
import path from 'path';
import fs from 'fs';

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.createInvoice({
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const patientId = req.query.patientId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const status = req.query.status as any;
    
    const result = await invoiceService.getInvoices(patientId, startDate, endDate, status, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    const pdfPath = await generateInvoicePDF(invoice);
    
    res.download(pdfPath, `invoice-${invoice.invoiceNumber}.pdf`, (err) => {
      if (err) {
        // Clean up file after sending
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        if (!res.headersSent) {
          next(err);
        }
      } else {
        // Clean up file after sending
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
};
