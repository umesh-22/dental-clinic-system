import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JWTPayload } from '../types';

export const generateAccessToken = (payload: JWTPayload): string => {
 return jwt.sign(
  payload,
  config.jwtSecret as string,
  {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  }
);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
 return jwt.sign(
  payload,
  config.jwtSecret as string,
  {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  }
);
};

export const verifyAccessToken = (token: string): JWTPayload => {
 return jwt.verify(token, config.jwtSecret as string) as JWTPayload;

};


export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwtSecret as string) as JWTPayload;

};
