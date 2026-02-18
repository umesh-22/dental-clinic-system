import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { PaymentStatus } from '@prisma/client';
import { config } from '../config/env';

const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0', 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
};

export const createInvoice = async (data: {
  patientId: string;
  appointmentId?: string;
  issuedBy: string;
  dueDate?: Date;
  discount?: number;
  items: Array<{
    treatmentId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}) => {
  const invoiceNumber = await generateInvoiceNumber();

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = data.discount || 0;
  const taxAmount = (subtotal - discount) * (config.clinicTaxRate / 100);
  const total = subtotal - discount + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      issuedBy: data.issuedBy,
      dueDate: data.dueDate,
      subtotal,
      taxRate: config.clinicTaxRate,
      taxAmount,
      discount,
      total,
      status: 'PENDING',
      items: {
        create: data.items.map(item => ({
          treatmentId: item.treatmentId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
        },
      },
      items: {
        include: {
          treatment: {
            select: {
              id: true,
              treatmentType: true,
            },
          },
        },
      },
    },
  });

  return invoice;
};

export const getInvoices = async (
  patientId?: string,
  startDate?: Date,
  endDate?: Date,
  status?: PaymentStatus,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) where.patientId = patientId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.issueDate = {};
    if (startDate) where.issueDate.gte = startDate;
    if (endDate) where.issueDate.lte = endDate;
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issueDate: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: true,
        payments: true,
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getInvoiceById = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      appointment: true,
      issuer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      items: {
        include: {
          treatment: true,
        },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  return invoice;
};

export const updateInvoiceStatus = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Number(invoice.total) - totalPaid;

  let status: PaymentStatus = 'PENDING';
  if (remaining <= 0) {
    status = 'PAID';
  } else if (totalPaid > 0) {
    status = 'PARTIAL';
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: totalPaid,
      status,
    },
  });

  return updated;
};
