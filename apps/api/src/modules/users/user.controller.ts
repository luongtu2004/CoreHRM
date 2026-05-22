import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, avatar: true, status: true, lastLoginAt: true, createdAt: true }
    });
    sendSuccess(res, users);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, name: true, email: true, phone: true, avatar: true, status: true, lastLoginAt: true, createdAt: true, userRoles: { include: { role: true } } }
    });
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, user);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, roleId } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, 400, 'Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone }
    });

    if (roleId) {
      await prisma.userRole.create({ data: { userId: user.id, roleId } });
    }

    sendSuccess(res, { id: user.id, name, email }, 'User created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, phone, status, roleId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { name, phone, status }
    });

    if (roleId) {
      // Very simple role update: clear existing and add new
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({ data: { userId: user.id, roleId } });
    }

    sendSuccess(res, { id: user.id, name }, 'User updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'User deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return sendError(res, 400, 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới');
    if (newPassword.length < 6) return sendError(res, 400, 'Mật khẩu mới phải có ít nhất 6 ký tự');

    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user) return sendError(res, 404, 'Không tìm thấy người dùng');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return sendError(res, 400, 'Mật khẩu hiện tại không chính xác');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: currentUser.id }, data: { password: hashed } });
    sendSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, avatar: true, status: true }
    });
    sendSuccess(res, user, 'Đã cập nhật hồ sơ');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
