import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const createPrescription = async (data: {
  patientId: string;
  doctorId: string;
  notes?: string;
  items: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}) => {
  const prescription = await prisma.prescription.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      notes: data.notes,
      items: {
        create: data.items,
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      items: true,
    },
  });

  return prescription;
};

export const getPrescriptions = async (
  patientId?: string,
  doctorId?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
      },
    }),
    prisma.prescription.count({ where }),
  ]);

  return {
    prescriptions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPrescriptionById = async (id: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      items: true,
    },
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  return prescription;
};

export const updatePrescription = async (id: string, data: {
  notes?: string;
  items?: Array<{
    id?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
}) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  // If items are being updated, delete old items and create new ones
  if (data.items) {
    await prisma.prescriptionItem.deleteMany({
      where: { prescriptionId: id },
    });
  }

  const updated = await prisma.prescription.update({
    where: { id },
    data: {
      notes: data.notes,
      ...(data.items && {
        items: {
          create: data.items,
        },
      }),
    },
    include: {
      patient: true,
      doctor: true,
      items: true,
    },
  });

  return updated;
};

export const deletePrescription = async (id: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
  });

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  await prisma.prescription.delete({
    where: { id },
  });

  return { message: 'Prescription deleted successfully' };
};
