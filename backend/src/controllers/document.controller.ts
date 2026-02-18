import { Request, Response, NextFunction } from 'express';
import * as documentService from '../services/document.service';
import { upload } from '../middleware/upload';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const document = await documentService.uploadDocument({
      patientId: req.body.patientId,
      type: req.body.type,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: req.body.description,
      uploadedBy: (req as any).user?.id,
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const patientId = req.query.patientId as string;
    const type = req.query.type as any;
    
    const result = await documentService.getDocuments(patientId, type, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    const filePath = path.join(process.cwd(), document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await documentService.deleteDocument(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
