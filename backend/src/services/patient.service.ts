import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const createPatient = async (data: {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
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
}) => {
  // Check if patient with same phone already exists
  const existing = await prisma.patient.findFirst({
    where: { phone: data.phone },
  });

  if (existing) {
    throw new AppError('Patient with this phone number already exists', 400);
  }

  const patient = await prisma.patient.create({
    data,
    include: {
      appointments: {
        take: 5,
        orderBy: { startTime: 'desc' },
      },
      treatments: {
        take: 5,
        orderBy: { treatmentDate: 'desc' },
      },
    },
  });

  return patient;
};

export const getPatients = async (page: number = 1, limit: number = 20, search?: string) => {
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      treatments: {
        orderBy: { treatmentDate: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      prescriptions: {
        orderBy: { date: 'desc' },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: true,
        },
      },
      invoices: {
        orderBy: { issueDate: 'desc' },
        include: {
          payments: true,
        },
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  return patient;
};

export const updatePatient = async (id: string, data: any) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  const updated = await prisma.patient.update({
    where: { id },
    data,
  });

  return updated;
};

export const deletePatient = async (id: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Soft delete
  await prisma.patient.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Patient deleted successfully' };
};
