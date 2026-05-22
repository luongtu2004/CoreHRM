import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } }
    });
    sendSuccess(res, departments);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id as string },
      include: { employees: { include: { user: { select: { name: true, email: true } } } } }
    });
    if (!department) return sendError(res, 404, 'Department not found');
    sendSuccess(res, department);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, managerId, status } = req.body;
    const department = await prisma.department.create({
      data: { name, description, managerId, status }
    });
    sendSuccess(res, department, 'Department created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, managerId, status } = req.body;
    const department = await prisma.department.update({
      where: { id: req.params.id as string },
      data: { name, description, managerId, status }
    });
    sendSuccess(res, department, 'Department updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Department deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
