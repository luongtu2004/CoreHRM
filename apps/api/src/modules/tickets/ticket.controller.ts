import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getTickets = async (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo, customerId, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (customerId) where.customerId = customerId;

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignedUser: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true, avatar: true } }
        }
      })
    ]);

    sendSuccess(res, {
      data: tickets,
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

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id as string },
      include: {
        customer: true,
        assignedUser: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } }
      }
    });
    if (!ticket) return sendError(res, 404, 'Ticket not found');
    sendSuccess(res, ticket);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = req.body;
    const ticket = await prisma.ticket.create({
      data: { ...data, createdBy: user.id }
    });
    sendSuccess(res, ticket, 'Ticket created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id as string },
      data
    });
    sendSuccess(res, ticket, 'Ticket updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    await prisma.ticket.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Ticket deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const resolveTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id as string },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });
    sendSuccess(res, ticket, 'Ticket resolved');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
