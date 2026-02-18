import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { AppointmentStatus } from '@prisma/client';

export const createAppointment = async (data: {
  patientId: string;
  doctorId?: string;
  chairNumber: number;
  startTime: Date;
  endTime: Date;
  notes?: string;
}) => {
  // Validate chair number (1-3)
  if (data.chairNumber < 1 || data.chairNumber > 3) {
    throw new AppError('Invalid chair number. Must be between 1 and 3', 400);
  }

  // Check for conflicts on the same chair
  const conflict = await prisma.appointment.findFirst({
    where: {
      chairNumber: data.chairNumber,
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
      OR: [
        {
          AND: [
            { startTime: { lte: data.startTime } },
            { endTime: { gt: data.startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: data.endTime } },
            { endTime: { gte: data.endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: data.startTime } },
            { endTime: { lte: data.endTime } },
          ],
        },
      ],
    },
  });

  if (conflict) {
    throw new AppError('Appointment conflict: Chair is already booked for this time', 400);
  }

  const appointment = await prisma.appointment.create({
    data,
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
    },
  });

  return appointment;
};

export const getAppointments = async (
  startDate?: Date,
  endDate?: Date,
  doctorId?: string,
  status?: AppointmentStatus,
  chairNumber?: number
) => {
  const where: any = {};

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = startDate;
    if (endDate) where.startTime.lte = endDate;
  }

  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = status;
  if (chairNumber) where.chairNumber = chairNumber;

  const appointments = await prisma.appointment.findMany({
    where,
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
    },
    orderBy: { startTime: 'asc' },
  });

  return appointments;
};

export const getAppointmentById = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      treatments: true,
      invoices: true,
    },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  return appointment;
};

export const updateAppointment = async (id: string, data: {
  doctorId?: string;
  chairNumber?: number;
  startTime?: Date;
  endTime?: Date;
  status?: AppointmentStatus;
  notes?: string;
}) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  // Check for conflicts if time or chair is being changed
  if (data.startTime || data.endTime || data.chairNumber) {
    const startTime = data.startTime || appointment.startTime;
    const endTime = data.endTime || appointment.endTime;
    const chairNumber = data.chairNumber || appointment.chairNumber;

    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        chairNumber,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflict) {
      throw new AppError('Appointment conflict: Chair is already booked for this time', 400);
    }
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data,
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
    },
  });

  return updated;
};

export const checkInAppointment = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
    },
  });

  return updated;
};

export const checkOutAppointment = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      checkedOutAt: new Date(),
    },
  });

  return updated;
};

export const cancelAppointment = async (id: string, reason?: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason ? `${appointment.notes || ''}\nCancelled: ${reason}`.trim() : appointment.notes,
    },
  });

  return updated;
};
