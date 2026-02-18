import prisma from '../config/database';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export const getDashboardStats = async (startDate?: Date, endDate?: Date) => {
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());

  const [
    totalPatients,
    totalAppointments,
    totalRevenue,
    todayAppointments,
    pendingInvoices,
    lowStockItems,
  ] = await Promise.all([
    prisma.patient.count({
      where: { isActive: true },
    }),
    prisma.appointment.count({
      where: {
        startTime: {
          gte: start,
          lte: end,
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.appointment.count({
      where: {
        startTime: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
    }),
    prisma.invoice.count({
      where: {
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
    }),
    prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM "Inventory"
      WHERE "isActive" = true
      AND "currentStock" <= "minStockLevel"
    `.then((result: any) => Number(result[0]?.count || 0)),
  ]);

  // Revenue by month
  const revenueByMonth = await prisma.payment.groupBy({
    by: ['paymentDate'],
    where: {
      paymentDate: {
        gte: startOfYear(new Date()),
        lte: endOfYear(new Date()),
      },
    },
    _sum: {
      amount: true,
    },
  });

  // Top treatments
  const topTreatments = await prisma.treatment.groupBy({
    by: ['treatmentType'],
    where: {
      treatmentDate: {
        gte: start,
        lte: end,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  });

  return {
    totalPatients,
    totalAppointments,
    totalRevenue: totalRevenue._sum.amount || 0,
    todayAppointments,
    pendingInvoices,
    lowStockItems,
    revenueByMonth,
    topTreatments,
  };
};

export const getRevenueReport = async (startDate: Date, endDate: Date) => {
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      invoice: {
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      paymentDate: 'desc',
    },
  });

  const revenueByMethod = await prisma.payment.groupBy({
    by: ['method'],
    where: {
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    payments,
    revenueByMethod,
    totalRevenue,
  };
};

export const getPatientAnalytics = async (startDate: Date, endDate: Date) => {
  const newPatients = await prisma.patient.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const appointmentsByPatient = await prisma.appointment.groupBy({
    by: ['patientId'],
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  const patientIds = appointmentsByPatient.map(a => a.patientId);
  const patients = await prisma.patient.findMany({
    where: {
      id: {
        in: patientIds,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  const topPatients = appointmentsByPatient.map(apt => ({
    patient: patients.find(p => p.id === apt.patientId),
    appointmentCount: apt._count.id,
  }));

  return {
    newPatients,
    topPatients,
  };
};

export const getDoctorPerformance = async (startDate: Date, endDate: Date) => {
  const treatmentsByDoctor = await prisma.treatment.groupBy({
    by: ['doctorId'],
    where: {
      treatmentDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      cost: true,
    },
  });

  const doctorIds = treatmentsByDoctor.map(t => t.doctorId);
  const doctors = await prisma.user.findMany({
    where: {
      id: {
        in: doctorIds,
      },
      role: 'DOCTOR',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  const performance = treatmentsByDoctor.map(t => ({
    doctor: doctors.find(d => d.id === t.doctorId),
    treatmentCount: t._count.id,
    totalRevenue: t._sum.cost || 0,
  }));

  return performance;
};
