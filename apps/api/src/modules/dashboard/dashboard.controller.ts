import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalEmployees,
      totalCustomers,
      openTasks,
      pendingTickets,
      presentToday,
      pendingLeaves,
      recentActivities
    ] = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
      prisma.customer.count(),
      prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.attendance.count({ where: { createdAt: { gte: today } } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatar: true } } }
      })
    ]);

    sendSuccess(res, {
      totalUsers,
      totalEmployees,
      totalCustomers,
      openTasks,
      pendingTickets,
      presentToday,
      pendingLeaves,
      recentActivities
    });
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getAttendanceWeek = async (req: Request, res: Response) => {
  try {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [checkIns, checkOuts] = await Promise.all([
        prisma.attendance.count({ where: { createdAt: { gte: date, lt: nextDate } } }),
        prisma.attendance.count({ where: { checkOut: { gte: date, lt: nextDate } } })
      ]);

      result.push({
        day: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        vào: checkIns,
        ra: checkOuts
      });
    }

    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
