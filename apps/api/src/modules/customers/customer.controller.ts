import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search, status, source, assignedTo, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = assignedTo;

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    sendSuccess(res, {
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id as string },
      include: { tickets: true }
    });
    if (!customer) return sendError(res, 404, 'Customer not found');
    sendSuccess(res, customer);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const customer = await prisma.customer.create({ data });
    sendSuccess(res, customer, 'Customer created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id as string },
      data
    });
    sendSuccess(res, customer, 'Customer updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Customer deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
