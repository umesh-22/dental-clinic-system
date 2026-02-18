import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const createTreatment = async (data: {
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  toothNumber?: string;
  treatmentType: string;
  description: string;
  clinicalNotes?: string;
  treatmentDate?: Date;
  status?: string;
  cost?: number;
}) => {
  const treatment = await prisma.treatment.create({
    data: {
      ...data,
      cost: data.cost || 0,
      status: data.status || 'PLANNED',
      treatmentDate: data.treatmentDate || new Date(),
    },
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
      appointment: {
        select: {
          id: true,
          startTime: true,
        },
      },
    },
  });

  return treatment;
};

export const getTreatments = async (
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
    where.treatmentDate = {};
    if (startDate) where.treatmentDate.gte = startDate;
    if (endDate) where.treatmentDate.lte = endDate;
  }

  const [treatments, total] = await Promise.all([
    prisma.treatment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { treatmentDate: 'desc' },
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
      },
    }),
    prisma.treatment.count({ where }),
  ]);

  return {
    treatments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getTreatmentById = async (id: string) => {
  const treatment = await prisma.treatment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      appointment: true,
      invoiceItems: {
        include: {
          invoice: true,
        },
      },
    },
  });

  if (!treatment) {
    throw new AppError('Treatment not found', 404);
  }

  return treatment;
};

export const updateTreatment = async (id: string, data: any) => {
  const treatment = await prisma.treatment.findUnique({
    where: { id },
  });

  if (!treatment) {
    throw new AppError('Treatment not found', 404);
  }

  const updated = await prisma.treatment.update({
    where: { id },
    data,
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
    },
  });

  return updated;
};

export const deleteTreatment = async (id: string) => {
  const treatment = await prisma.treatment.findUnique({
    where: { id },
  });

  if (!treatment) {
    throw new AppError('Treatment not found', 404);
  }

  await prisma.treatment.delete({
    where: { id },
  });

  return { message: 'Treatment deleted successfully' };
};
