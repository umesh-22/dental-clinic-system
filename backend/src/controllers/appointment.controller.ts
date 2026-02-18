import { Request, Response, NextFunction } from 'express';
import * as appointmentService from '../services/appointment.service';

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.createAppointment({
      ...req.body,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const doctorId = req.query.doctorId as string;
    const status = req.query.status as any;
    const chairNumber = req.query.chairNumber ? parseInt(req.query.chairNumber as string) : undefined;
    
    const appointments = await appointmentService.getAppointments(
      startDate,
      endDate,
      doctorId,
      status,
      chairNumber
    );
    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = { ...req.body };
    if (data.startTime) data.startTime = new Date(data.startTime);
    if (data.endTime) data.endTime = new Date(data.endTime);
    
    const appointment = await appointmentService.updateAppointment(req.params.id, data);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.checkInAppointment(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.checkOutAppointment(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await appointmentService.cancelAppointment(req.params.id, req.body.reason);
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};
