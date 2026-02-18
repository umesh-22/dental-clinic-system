import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { DocumentType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const uploadDocument = async (data: {
  patientId: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedBy?: string;
}) => {
  const document = await prisma.document.create({
    data,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return document;
};

export const getDocuments = async (
  patientId?: string,
  type?: DocumentType,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (patientId) where.patientId = patientId;
  if (type) where.type = type;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getDocumentById = async (id: string) => {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      patient: true,
    },
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  return document;
};

export const deleteDocument = async (id: string) => {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  // Delete file from filesystem
  const filePath = path.join(process.cwd(), document.filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.document.delete({
    where: { id },
  });

  return { message: 'Document deleted successfully' };
};
