import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../../utils/response';
import { haversineDistance } from '../../utils/haversine';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Helper: Lấy URL public của ảnh selfie
const getPhotoUrl = (req: Request, filename: string | undefined) => {
  if (!filename) return null;
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/attendance/${filename}`;
};

// ─── CHECK IN ─────────────────────────────────────────────────────────────────
export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { lat, lng, note, location } = req.body;
    const photoFile = (req as any).file;

    // 1. Kiểm tra đã chấm công hôm nay chưa
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { userId, createdAt: { gte: today } },
    });

    if (existing) {
      // Xóa ảnh vừa upload nếu có (tránh rác)
      if (photoFile) fs.unlink(photoFile.path, () => {});
      return sendError(res, 400, 'Bạn đã chấm công vào hôm nay rồi!');
    }

    // 2. Kiểm tra GPS nếu cung cấp tọa độ
    let status = 'PRESENT';
    // Ưu tiên dùng tên địa điểm từ reverse geocoding (nếu có)
    let locationIn: string | null = location || null;

    if (lat !== undefined && lng !== undefined) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      const officeSetting = await prisma.officeSettings.findFirst();
      if (officeSetting) {
        // Kiểm tra khoảng cách GPS
        const distance = haversineDistance(
          latNum, lngNum,
          officeSetting.latitude, officeSetting.longitude
        );
        if (distance > officeSetting.radius) {
          if (photoFile) fs.unlink(photoFile.path, () => {});
          return sendError(
            res, 400,
            `Bạn đang cách văn phòng ${Math.round(distance)}m. Vui lòng đến trong phạm vi ${officeSetting.radius}m để chấm công!`
          );
        }
        // Kiểm tra đi muộn
        const now = new Date();
        const [endH, endM] = officeSetting.checkInEnd.split(':').map(Number);
        const lateThreshold = new Date();
        lateThreshold.setHours(endH, endM, 0, 0);
        if (now > lateThreshold) status = 'LATE';
      }

      // Fallback: luôn lưu vị trí (dùng geocoded name hoặc tọa độ) dù có hay không có OfficeSettings
      if (!locationIn) locationIn = `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`;
    }

    // 3. Tạo bản ghi chấm công
    const photoUrl = photoFile ? getPhotoUrl(req, photoFile.filename) : null;

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        locationIn,
        note,
        status,
        checkInLat: lat !== undefined ? parseFloat(lat) : null,
        checkInLng: lng !== undefined ? parseFloat(lng) : null,
        photoIn: photoUrl,
      },
    });

    sendSuccess(res, attendance, `Chấm công vào thành công! ${status === 'LATE' ? '(Đi muộn)' : ''}`);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

// ─── CHECK OUT ────────────────────────────────────────────────────────────────
export const checkOut = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { lat, lng, location } = req.body;
    const photoFile = (req as any).file;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: { userId, checkOut: null, createdAt: { gte: today } },
    });

    if (!attendance) {
      if (photoFile) fs.unlink(photoFile.path, () => {});
      return sendError(res, 400, 'Không tìm thấy lượt chấm công vào nào hôm nay!');
    }

    const photoUrl = photoFile ? getPhotoUrl(req, photoFile.filename) : null;
    // Ưu tiên dùng tên địa điểm từ reverse geocoding (nếu có)
    let locationOut: string | null = location || null;
    let newStatus = attendance.status;

    if (lat !== undefined && lng !== undefined) {
      // Nếu chưa có tên địa điểm từ geocoding, dùng tọa độ thô
      if (!locationOut) locationOut = `${parseFloat(lat).toFixed(6)},${parseFloat(lng).toFixed(6)}`;

      // Kiểm tra về sớm
      const officeSett = await prisma.officeSettings.findFirst();
      if (officeSett) {
        const now = new Date();
        const [endH, endM] = officeSett.workEndTime.split(':').map(Number);
        const workEndThreshold = new Date();
        workEndThreshold.setHours(endH, endM, 0, 0);
        if (now < workEndThreshold && attendance.status !== 'LATE') {
          newStatus = 'EARLY_LEAVE';
        }
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        locationOut,
        checkOutLat: lat !== undefined ? parseFloat(lat) : null,
        checkOutLng: lng !== undefined ? parseFloat(lng) : null,
        photoOut: photoUrl,
        status: newStatus,
      },
    });

    sendSuccess(res, updated, 'Chấm công ra thành công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

// ─── GET MY ATTENDANCE ────────────────────────────────────────────────────────
export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const attendances = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    sendSuccess(res, attendances);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

// ─── GET ALL ATTENDANCE (ADMIN) ───────────────────────────────────────────────
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { date, userId: filterUserId } = req.query;

    const where: any = {};
    if (filterUserId) where.userId = filterUserId as string;
    if (date) {
      const d = new Date(date as string);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      where.createdAt = { gte: d, lte: dEnd };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
            employee: { select: { employeeCode: true, position: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, attendances);
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

// ─── ADMIN MANUAL CORRECTION ──────────────────────────────────────────────────
export const adminCorrectAttendance = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      date,           // YYYY-MM-DD
      checkIn: checkInTime,   // HH:mm
      checkOut: checkOutTime, // HH:mm | null
      status,
      note,
    } = req.body;

    if (!userId || !date) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc: userId và date');
    }

    const buildDateTime = (dateStr: string, timeStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, 0);
    };

    const checkInDate = buildDateTime(date, checkInTime || '08:00');
    const checkOutDate = checkOutTime ? buildDateTime(date, checkOutTime) : null;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
    });

    let result;
    if (existing) {
      result = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: status || existing.status,
          note: note || existing.note,
        },
      });
    } else {
      result = await prisma.attendance.create({
        data: {
          userId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: status || 'PRESENT',
          note: note || 'Điều chỉnh thủ công bởi Admin',
          createdAt: checkInDate,
        },
      });
    }

    sendSuccess(res, result, existing ? 'Đã cập nhật bản ghi chấm công!' : 'Đã tạo bản ghi chấm công thủ công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};

// ─── DELETE ATTENDANCE (ADMIN) ────────────────────────────────────────────────
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({ where: { id: id as string } });
    sendSuccess(res, null, 'Đã xóa bản ghi chấm công!');
  } catch (error: any) {
    sendError(res, 500, 'Lỗi máy chủ', error.message);
  }
};
