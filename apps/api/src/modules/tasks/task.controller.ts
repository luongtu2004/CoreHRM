import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedUser: { select: { name: true, avatar: true } },
          creator: { select: { name: true, avatar: true } }
        }
      })
    ]);

    sendSuccess(res, {
      data: tasks,
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

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id as string },
      include: {
        assignedUser: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } }
      }
    });
    if (!task) return sendError(res, 404, 'Task not found');
    sendSuccess(res, task);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = req.body;
    const task = await prisma.task.create({
      data: { ...data, createdBy: user.id }
    });
    sendSuccess(res, task, 'Task created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.status === 'DONE' && !data.completedAt) {
      data.completedAt = new Date();
    }
    const task = await prisma.task.update({
      where: { id: req.params.id as string },
      data
    });
    sendSuccess(res, task, 'Task updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Task deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const completedAt = status === 'DONE' ? new Date() : null;
    const task = await prisma.task.update({
      where: { id: req.params.id as string },
      data: { status, completedAt: completedAt as any }
    });
    sendSuccess(res, task, 'Task status updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
