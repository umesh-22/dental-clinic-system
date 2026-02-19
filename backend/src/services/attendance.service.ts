import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const clockIn = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing && existing.clockIn) {
    throw new AppError('Already clocked in today', 400);
  }

  const attendance = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: today } },
    update: { clockIn: new Date() },
    create: { userId, date: today, clockIn: new Date() },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  return attendance;
};

export const clockOut = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!attendance || !attendance.clockIn) {
    throw new AppError('Not clocked in today', 400);
  }

  if (attendance.clockOut) {
    throw new AppError('Already clocked out today', 400);
  }

  const clockOutTime = new Date();
  const clockInTime = attendance.clockIn;

  const breakDuration =
    attendance.breakStart && attendance.breakEnd
      ? (attendance.breakEnd.getTime() - attendance.breakStart.getTime()) / (1000 * 60 * 60)
      : 0;

  const calculatedHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60) - breakDuration;
  const totalHours = calculatedHours > 0 ? calculatedHours : 0;

  const updated = await prisma.attendance.update({
    where: { userId_date: { userId, date: today } },
    data: { clockOut: clockOutTime, totalHours },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  return updated;
};

export const getAttendance = async (
  userId?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    attendance,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const updateAttendance = async (
  userId: string,
  date: Date,
  data: { clockIn?: Date; clockOut?: Date; breakStart?: Date; breakEnd?: Date; notes?: string }
) => {
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: attendanceDate } },
  });

  if (!attendance) {
    throw new AppError('Attendance record not found', 404);
  }

  let totalHours = attendance.totalHours ?? 0;

  if (data.clockIn || data.clockOut) {
    const clockIn = data.clockIn || attendance.clockIn;
    const clockOut = data.clockOut || attendance.clockOut;

    if (clockIn && clockOut) {
      const breakDuration =
        (data.breakStart && data.breakEnd) || (attendance.breakStart && attendance.breakEnd)
          ? ((data.breakEnd || attendance.breakEnd!).getTime() - (data.breakStart || attendance.breakStart!).getTime()) /
            (1000 * 60 * 60)
          : 0;

      const calculatedHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) - breakDuration;
      totalHours = calculatedHours > 0 ? calculatedHours : 0;
    }
  }

  const updated = await prisma.attendance.update({
    where: { userId_date: { userId, date: attendanceDate } },
    data: { ...data, totalHours },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  return updated;
};
