import { UserRole, AppointmentStatus, PaymentMethod, PaymentStatus, DocumentType } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export { UserRole, AppointmentStatus, PaymentMethod, PaymentStatus, DocumentType };
