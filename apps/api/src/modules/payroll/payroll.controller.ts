import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getPayslips = async (req: Request, res: Response) => {
  try {
    const { userId, month, year, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};
    if (userId) where.userId = userId;
    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);
    if (status) where.status = status;

    const [total, payslips] = await Promise.all([
      prisma.payslip.count({ where }),
      prisma.payslip.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          }
        }
      })
    ]);

    sendSuccess(res, {
      data: payslips,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getMyPayslips = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const payslips = await prisma.payslip.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    sendSuccess(res, payslips);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getPayslipById = async (req: Request, res: Response) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id as string },
      include: { user: { select: { name: true, email: true, avatar: true } } }
    });
    if (!payslip) return sendError(res, 404, 'Không tìm thấy phiếu lương');
    sendSuccess(res, payslip);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const generatePayslips = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return sendError(res, 400, 'Thiếu tháng hoặc năm');

    // Get all active employees with their salary
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true } } }
    });

    if (employees.length === 0) return sendError(res, 400, 'Không có nhân viên đang hoạt động');

    // Calculate working days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay();
      if (day !== 0 && day !== 6) workingDays++;
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const created: any[] = [];
    const skipped: any[] = [];

    for (const emp of employees) {
      // Check if already exists
      const existing = await prisma.payslip.findUnique({
        where: { userId_month_year: { userId: emp.userId, month, year } }
      });
      if (existing) { skipped.push(emp.user.name); continue; }

      // Count actual attendance days
      const attendanceCount = await prisma.attendance.count({
        where: {
          userId: emp.userId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      });

      // Count approved paid leave days
      const paidLeaves = await prisma.leaveRequest.findMany({
        where: {
          userId: emp.userId,
          status: 'APPROVED',
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
          leaveType: { isPaid: true }
        }
      });
      const paidLeaveDays = paidLeaves.reduce((sum, l) => sum + l.totalDays, 0);

      const unpaidLeaves = await prisma.leaveRequest.findMany({
        where: {
          userId: emp.userId,
          status: 'APPROVED',
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
          leaveType: { isPaid: false }
        }
      });
      const unpaidLeaveDays = unpaidLeaves.reduce((sum, l) => sum + l.totalDays, 0);

      const baseSalary = emp.salary ?? 0;
      const dailyRate = workingDays > 0 ? baseSalary / workingDays : 0;
      const deductionFromAbsence = dailyRate * unpaidLeaveDays;
      const netSalary = Math.max(0, baseSalary - deductionFromAbsence);

      const payslip = await prisma.payslip.create({
        data: {
          userId: emp.userId,
          month,
          year,
          baseSalary,
          allowance: 0,
          deduction: deductionFromAbsence,
          netSalary,
          workingDays,
          actualDays: attendanceCount,
          leavesPaid: paidLeaveDays,
          leavesUnpaid: unpaidLeaveDays,
          status: 'DRAFT'
        }
      });
      created.push(payslip);
    }

    sendSuccess(res, { created: created.length, skipped: skipped.length, payslips: created },
      `Đã tạo ${created.length} phiếu lương, bỏ qua ${skipped.length} (đã tồn tại)`);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updatePayslip = async (req: Request, res: Response) => {
  try {
    const { allowance, deduction, note } = req.body;
    const payslip = await prisma.payslip.findUnique({ where: { id: req.params.id as string } });
    if (!payslip) return sendError(res, 404, 'Không tìm thấy phiếu lương');

    const newAllowance = allowance ?? payslip.allowance;
    const newDeduction = deduction ?? payslip.deduction;
    const netSalary = Math.max(0, payslip.baseSalary + newAllowance - newDeduction);

    const updated = await prisma.payslip.update({
      where: { id: req.params.id as string },
      data: { allowance: newAllowance, deduction: newDeduction, netSalary, note }
    });
    sendSuccess(res, updated, 'Đã cập nhật phiếu lương');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const confirmPayslip = async (req: Request, res: Response) => {
  try {
    const payslip = await prisma.payslip.update({
      where: { id: req.params.id as string },
      data: { status: 'CONFIRMED' },
      include: { user: { select: { id: true, name: true } } }
    });

    await prisma.notification.create({
      data: {
        userId: payslip.userId,
        title: 'Phiếu lương tháng đã được xác nhận 💰',
        content: `Phiếu lương tháng ${payslip.month}/${payslip.year} của bạn đã được xác nhận. Lương net: ${payslip.netSalary.toLocaleString('vi-VN')}đ`,
        type: 'SYSTEM',
        link: '/dashboard/payroll'
      }
    });

    sendSuccess(res, payslip, 'Đã xác nhận phiếu lương');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const markPayslipPaid = async (req: Request, res: Response) => {
  try {
    const payslip = await prisma.payslip.update({
      where: { id: req.params.id as string },
      data: { status: 'PAID' }
    });
    sendSuccess(res, payslip, 'Đã đánh dấu đã thanh toán');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deletePayslip = async (req: Request, res: Response) => {
  try {
    await prisma.payslip.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Đã xóa phiếu lương');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
