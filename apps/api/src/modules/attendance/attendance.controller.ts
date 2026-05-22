import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { location, note } = req.body;

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: { gte: today }
      }
    });

    if (existing) {
      return sendError(res, 400, 'Bạn đã chấm công vào hôm nay rồi!');
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        locationIn: location,
        note,
        status: 'PRESENT'
      }
    });

    sendSuccess(res, attendance, 'Chấm công vào thành công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

export const checkOut = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { location } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOut: null,
        createdAt: { gte: today }
      }
    });

    if (!attendance) {
      return sendError(res, 400, 'Không tìm thấy lượt chấm công vào nào hôm nay!');
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        locationOut: location
      }
    });

    sendSuccess(res, updated, 'Chấm công ra thành công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const attendances = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    sendSuccess(res, attendances);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, attendances);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};
