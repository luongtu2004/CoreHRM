import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    sendSuccess(res, notifications);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    sendSuccess(res, { count });
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId },
      data: { isRead: true } 
    });
    sendSuccess(res, null, 'Đã đánh dấu đã đọc');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    sendSuccess(res, null, 'Đã đánh dấu tất cả là đã đọc');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.deleteMany({ where: { id: req.params.id as string, userId } });
    sendSuccess(res, null, 'Đã xóa thông báo');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.deleteMany({ where: { userId } });
    sendSuccess(res, null, 'Đã xóa tất cả thông báo');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
