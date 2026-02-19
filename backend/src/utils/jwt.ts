import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { config } from '../config/env';

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn } as SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => jwt.verify(token, config.jwtSecret) as JWTPayload;
export const verifyRefreshToken = (token: string): JWTPayload => jwt.verify(token, config.jwtRefreshSecret) as JWTPayload;
