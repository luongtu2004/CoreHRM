import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 401, 'Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 401, 'Unauthorized or Inactive User');
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid Token');
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return sendError(res, 401, 'Unauthorized');

    // Mặc định ADMIN có quyền truy cập tất cả
    const roles = ['ADMIN', ...allowedRoles];
    const userRoles = user.userRoles.map((ur: any) => ur.role.name);
    
    const hasRole = roles.some(r => userRoles.includes(r));

    if (!hasRole) {
      return sendError(res, 403, 'Bạn không có quyền thực hiện chức năng này!');
    }
    
    next();
  };
};
