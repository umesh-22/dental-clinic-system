export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'STAFF';

export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export type DocumentType = 'XRAY' | 'REPORT' | 'PHOTO' | 'OTHER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  bloodGroup?: string;
  occupation?: string;
  referredBy?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string;
  chairNumber: number;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  patient?: Patient;
  doctor?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  toothNumber?: string;
  treatmentType: string;
  description: string;
  clinicalNotes?: string;
  treatmentDate: string;
  status: string;
  outcome?: string;
  cost: number;
  patient?: Patient;
  doctor?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  notes?: string;
  patient?: Patient;
  doctor?: User;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string;
  issuedBy: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  status: PaymentStatus;
  notes?: string;
  patient?: Patient;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  reference?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitPrice?: number;
  expiryDate?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  notes?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  patientId: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}
