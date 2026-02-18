import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendance.service';
import { RequestWithUser } from '../types';
import { AppError } from '../utils/errors';

export const clockIn = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const attendance = await attendanceService.clockIn(req.user.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

export const clockOut = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const attendance = await attendanceService.clockOut(req.user.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const result = await attendanceService.getAttendance(userId, startDate, endDate, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = { ...req.body };
    if (data.clockIn) data.clockIn = new Date(data.clockIn);
    if (data.clockOut) data.clockOut = new Date(data.clockOut);
    if (data.breakStart) data.breakStart = new Date(data.breakStart);
    if (data.breakEnd) data.breakEnd = new Date(data.breakEnd);
    
    const attendance = await attendanceService.updateAttendance(
      req.params.userId,
      new Date(req.params.date),
      data
    );
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};
