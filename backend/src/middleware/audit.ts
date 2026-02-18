import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { RequestWithUser } from '../types';

export const auditLog = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function (body) {
    // Log after response is sent
    setImmediate(async () => {
      try {
        const action = `${req.method} ${req.path}`;
        const entityType = req.path.split('/')[1] || 'unknown';
        const entityId = req.params.id || null;

        await prisma.auditLog.create({
          data: {
            userId: req.user?.id,
            action,
            entityType,
            entityId,
            details: JSON.stringify({
              method: req.method,
              path: req.path,
              query: req.query,
              body: req.method !== 'GET' ? req.body : undefined,
            }),
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
          },
        });
      } catch (error) {
        console.error('Audit log error:', error);
      }
    });

    return originalSend.call(this, body);
  };

  next();
};
