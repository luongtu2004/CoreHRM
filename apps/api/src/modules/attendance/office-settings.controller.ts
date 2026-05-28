import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const prisma = new PrismaClient();

// GET cài đặt văn phòng (luôn trả về 1 bản ghi duy nhất, tạo mới nếu chưa có)
export const getOfficeSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.officeSettings.findFirst();
    if (!settings) {
      settings = await prisma.officeSettings.create({ data: {} });
    }
    sendSuccess(res, settings);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

// PUT cập nhật cài đặt văn phòng
export const updateOfficeSettings = async (req: Request, res: Response) => {
  try {
    const { name, latitude, longitude, radius, checkInStart, checkInEnd, workEndTime } = req.body;

    let settings = await prisma.officeSettings.findFirst();

    if (!settings) {
      settings = await prisma.officeSettings.create({
        data: {
          name, latitude, longitude, radius,
          checkInStart, checkInEnd, workEndTime,
        },
      });
    } else {
      settings = await prisma.officeSettings.update({
        where: { id: settings.id },
        data: {
          ...(name !== undefined && { name }),
          ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
          ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
          ...(radius !== undefined && { radius: parseInt(radius) }),
          ...(checkInStart !== undefined && { checkInStart }),
          ...(checkInEnd !== undefined && { checkInEnd }),
          ...(workEndTime !== undefined && { workEndTime }),
        },
      });
    }

    sendSuccess(res, settings, 'Cập nhật cài đặt văn phòng thành công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};
