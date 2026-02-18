import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { InventoryTransactionType } from '@prisma/client';

export const createInventoryItem = async (data: {
  name: string;
  description?: string;
  category: string;
  unit: string;
  currentStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unitPrice?: number;
  expiryDate?: Date;
  supplier?: string;
}) => {
  const inventory = await prisma.inventory.create({
    data: {
      ...data,
      currentStock: data.currentStock || 0,
      minStockLevel: data.minStockLevel || 0,
    },
  });

  return inventory;
};

export const getInventoryItems = async (
  category?: string,
  lowStock?: boolean,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (category) where.category = category;
  // Note: Low stock filtering is handled in application logic
  // as Prisma doesn't support comparing two columns directly in all cases

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.inventory.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getInventoryItemById = async (id: string) => {
  const item = await prisma.inventory.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { transactionDate: 'desc' },
        take: 50,
      },
    },
  });

  if (!item) {
    throw new AppError('Inventory item not found', 404);
  }

  return item;
};

export const updateInventoryItem = async (id: string, data: any) => {
  const item = await prisma.inventory.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError('Inventory item not found', 404);
  }

  const updated = await prisma.inventory.update({
    where: { id },
    data,
  });

  return updated;
};

export const createInventoryTransaction = async (data: {
  inventoryId: string;
  treatmentId?: string;
  type: InventoryTransactionType;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id: data.inventoryId },
  });

  if (!inventory) {
    throw new AppError('Inventory item not found', 404);
  }

  // Calculate new stock
  let newStock = Number(inventory.currentStock);
  if (data.type === 'PURCHASE' || data.type === 'ADJUSTMENT') {
    newStock += data.quantity;
  } else if (data.type === 'SALE' || data.type === 'USAGE' || data.type === 'EXPIRED') {
    newStock -= data.quantity;
    if (newStock < 0) {
      throw new AppError('Insufficient stock', 400);
    }
  }

  const totalAmount = data.unitPrice ? data.quantity * data.unitPrice : null;

  const transaction = await prisma.$transaction(async (tx) => {
    const newTransaction = await tx.inventoryTransaction.create({
      data: {
        ...data,
        totalAmount,
      },
    });

    await tx.inventory.update({
      where: { id: data.inventoryId },
      data: { currentStock: newStock },
    });

    return newTransaction;
  });

  return transaction;
};

export const getLowStockItems = async () => {
  const items = await prisma.inventory.findMany({
    where: {
      isActive: true,
    },
    orderBy: { currentStock: 'asc' },
  });

  // Filter in application logic
  return items.filter(item => Number(item.currentStock) <= Number(item.minStockLevel));
};
