import { Request } from "express";
import { UserRole, AppointmentStatus, PaymentMethod, PaymentStatus, DocumentType } from "@prisma/client";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export { UserRole, AppointmentStatus, PaymentMethod, PaymentStatus, DocumentType };
