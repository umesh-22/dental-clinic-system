import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/errors';
import { RequestWithUser } from '../types';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const user = await authService.register(
      validated.email,
      validated.password,
      validated.firstName,
      validated.lastName,
      validated.role
    );
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated.email, validated.password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password required', 400);
    }
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
