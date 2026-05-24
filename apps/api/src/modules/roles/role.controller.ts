import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { module: 'asc' }
    });
    sendSuccess(res, permissions);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } } } });
    sendSuccess(res, roles);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const role = await prisma.role.create({ data: { name, description } });
    sendSuccess(res, role, 'Role created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const role = await prisma.role.update({
      where: { id: req.params.id as string },
      data: { name, description }
    });
    sendSuccess(res, role, 'Role updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    await prisma.role.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Role deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const assignPermissions = async (req: Request, res: Response) => {
  try {
    const { permissionIds } = req.body; // array of strings
    const roleId = req.params.id as string;

    await prisma.rolePermission.deleteMany({ where: { roleId } });

    const assignments = permissionIds.map((permissionId: string) => ({
      roleId,
      permissionId
    }));

    if (assignments.length > 0) {
      await prisma.rolePermission.createMany({ data: assignments });
    }

    sendSuccess(res, null, 'Permissions assigned successfully');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
