import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

// ─── Leave Types ─────────────────────────────────────────────────────────────

export const getLeaveTypes = async (req: Request, res: Response) => {
  try {
    const types = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    sendSuccess(res, types);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createLeaveType = async (req: Request, res: Response) => {
  try {
    const { name, description, maxDaysPerYear, isPaid } = req.body;
    const type = await prisma.leaveType.create({
      data: { name, description, maxDaysPerYear: maxDaysPerYear ?? 12, isPaid: isPaid ?? true }
    });
    sendSuccess(res, type, 'Loại nghỉ phép đã được tạo');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateLeaveType = async (req: Request, res: Response) => {
  try {
    const type = await prisma.leaveType.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendSuccess(res, type, 'Đã cập nhật loại nghỉ phép');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteLeaveType = async (req: Request, res: Response) => {
  try {
    await prisma.leaveType.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Đã xóa loại nghỉ phép');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

// ─── Leave Requests ──────────────────────────────────────────────────────────

export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    const { status, userId, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [total, requests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          leaveType: true
        }
      })
    ]);

    sendSuccess(res, {
      data: requests,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getMyLeaveRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const requests = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { leaveType: true }
    });
    sendSuccess(res, requests);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return sendError(res, 400, 'Ngày kết thúc phải sau ngày bắt đầu');

    // Calculate working days (excluding weekends)
    let totalDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) totalDays++;
      current.setDate(current.getDate() + 1);
    }
    if (totalDays === 0) return sendError(res, 400, 'Không có ngày làm việc trong khoảng thời gian chọn');

    const request = await prisma.leaveRequest.create({
      data: { userId, leaveTypeId, startDate: start, endDate: end, totalDays, reason, status: 'PENDING' },
      include: { leaveType: true, user: { select: { name: true, email: true } } }
    });

    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { userRoles: { some: { role: { name: 'Super Admin' } } } },
      select: { id: true }
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: 'Yêu cầu nghỉ phép mới',
          content: `${request.user.name} xin nghỉ ${totalDays} ngày (${request.leaveType.name})`,
          type: 'LEAVE',
          link: '/dashboard/leaves'
        }))
      });
    }

    sendSuccess(res, request, 'Đã gửi yêu cầu nghỉ phép');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const approveLeaveRequest = async (req: Request, res: Response) => {
  try {
    const approver = (req as any).user;
    const { note } = req.body;

    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedBy: approver.id, approvedAt: new Date(), note },
      include: { user: true, leaveType: true }
    });

    // Notify the requester
    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: 'Yêu cầu nghỉ phép được duyệt ✅',
        content: `Đơn xin nghỉ ${leave.leaveType.name} từ ${leave.startDate.toLocaleDateString('vi-VN')} đã được phê duyệt.`,
        type: 'LEAVE',
        link: '/dashboard/leaves'
      }
    });

    sendSuccess(res, leave, 'Đã phê duyệt yêu cầu nghỉ phép');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const rejectLeaveRequest = async (req: Request, res: Response) => {
  try {
    const approver = (req as any).user;
    const { note } = req.body;

    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', approvedBy: approver.id, approvedAt: new Date(), note },
      include: { user: true, leaveType: true }
    });

    await prisma.notification.create({
      data: {
        userId: leave.userId,
        title: 'Yêu cầu nghỉ phép bị từ chối ❌',
        content: `Đơn xin nghỉ ${leave.leaveType.name} từ ${leave.startDate.toLocaleDateString('vi-VN')} đã bị từ chối. Lý do: ${note || 'Không có'}`,
        type: 'LEAVE',
        link: '/dashboard/leaves'
      }
    });

    sendSuccess(res, leave, 'Đã từ chối yêu cầu nghỉ phép');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const cancelLeaveRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!leave) return sendError(res, 404, 'Không tìm thấy yêu cầu');
    if (leave.userId !== userId) return sendError(res, 403, 'Bạn không có quyền hủy yêu cầu này');
    if (leave.status !== 'PENDING') return sendError(res, 400, 'Chỉ có thể hủy yêu cầu đang chờ duyệt');

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    sendSuccess(res, updated, 'Đã hủy yêu cầu nghỉ phép');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
