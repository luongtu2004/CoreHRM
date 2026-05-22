import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 400, 'Email hoặc mật khẩu không chính xác!');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return sendError(res, 400, 'Email hoặc mật khẩu không chính xác!');

    if (user.status !== 'ACTIVE') return sendError(res, 403, 'Tài khoản của bạn đang bị khóa!');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = signToken({ userId: user.id });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    sendSuccess(res, { token, user: userWithoutPassword }, 'Đăng nhập thành công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, status: true, lastLoginAt: true, createdAt: true,
        userRoles: { include: { role: true } },
        employee: {
          select: {
            id: true, employeeCode: true, position: true,
            salary: true, startDate: true, status: true,
            department: { select: { id: true, name: true } }
          }
        }
      }
    });
    if (!user) return sendError(res, 404, 'Không tìm thấy người dùng');
    sendSuccess(res, user);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};
