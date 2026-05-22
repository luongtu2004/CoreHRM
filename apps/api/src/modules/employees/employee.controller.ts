import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
        department: { select: { name: true } }
      }
    });
    sendSuccess(res, employees);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
        department: true
      }
    });
    if (!employee) return sendError(res, 404, 'Employee not found');
    sendSuccess(res, employee);
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { userId, departmentId, position, dateOfBirth, gender, address, startDate, salary, status } = req.body;

    const existingUser = await prisma.employee.findUnique({ where: { userId } });
    if (existingUser) return sendError(res, 400, 'User already has an employee record');

    // Auto-generate employee code
    const count = await prisma.employee.count();
    const employeeCode = `EMP${String(count + 1).padStart(3, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        userId,
        departmentId: departmentId || null,
        employeeCode,
        position,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        startDate: startDate ? new Date(startDate) : null,
        salary: salary ? parseFloat(salary) : null,
        status: status || 'ACTIVE'
      }
    });
    sendSuccess(res, employee, 'Employee created');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};


export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { departmentId, position, dateOfBirth, gender, address, startDate, salary, status } = req.body;
    const employee = await prisma.employee.update({
      where: { id: req.params.id as string },
      data: {
        departmentId,
        position,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        startDate: startDate ? new Date(startDate) : undefined,
        salary,
        status
      }
    });
    sendSuccess(res, employee, 'Employee updated');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id as string } });
    sendSuccess(res, null, 'Employee deleted');
  } catch (error: any) {
    sendError(res, 500, 'Server error', error.message);
  }
};
