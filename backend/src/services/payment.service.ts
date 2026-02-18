import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { PaymentMethod } from '@prisma/client';
import { updateInvoiceStatus } from './invoice.service';

export const createPayment = async (data: {
  invoiceId: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  reference?: string;
  notes?: string;
}) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: {
      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Number(invoice.total) - totalPaid;

  if (data.amount > remaining) {
    throw new AppError(`Payment amount exceeds remaining balance. Remaining: ${remaining}`, 400);
  }

  const payment = await prisma.payment.create({
    data,
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
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Update invoice status
  await updateInvoiceStatus(data.invoiceId);

  return payment;
};

export const getPayments = async (
  invoiceId?: string,
  patientId?: string,
  startDate?: Date,
  endDate?: Date,
  method?: PaymentMethod,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (invoiceId) where.invoiceId = invoiceId;
  if (patientId) where.patientId = patientId;
  if (method) where.method = method;
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = startDate;
    if (endDate) where.paymentDate.lte = endDate;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPaymentById = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: true,
      patient: true,
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  return payment;
};
