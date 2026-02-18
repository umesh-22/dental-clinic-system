import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventory.service';

export const createInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.createInventoryItem({
      ...req.body,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const getInventoryItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const lowStock = req.query.lowStock === 'true';
    
    const result = await inventoryService.getInventoryItems(category, lowStock, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.getInventoryItemById(req.params.id);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = { ...req.body };
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    
    const item = await inventoryService.updateInventoryItem(req.params.id, data);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await inventoryService.createInventoryTransaction({
      ...req.body,
      transactionDate: req.body.transactionDate ? new Date(req.body.transactionDate) : undefined,
    });
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await inventoryService.getLowStockItems();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
