import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cron job: Chạy lúc 23:59 mỗi ngày
 * Tự động tạo bản ghi ABSENT cho nhân viên chưa chấm công trong ngày
 */
export const startAbsentCron = () => {
  cron.schedule('59 23 * * *', async () => {
    console.log('[CRON] 🕐 Đang kiểm tra nhân viên vắng mặt...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Lấy tất cả user đang active
      const allUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Lấy danh sách userId đã có bản ghi chấm công hôm nay
      const checkedInToday = await prisma.attendance.findMany({
        where: { createdAt: { gte: today, lt: tomorrow } },
        select: { userId: true },
      });
      const checkedInSet = new Set(checkedInToday.map((a: any) => a.userId));

      // Tạo bản ghi ABSENT cho những người chưa chấm công
      const absentUsers = allUsers.filter((u: any) => !checkedInSet.has(u.id));

      if (absentUsers.length > 0) {
        await prisma.attendance.createMany({
          data: absentUsers.map((u: any) => ({
            userId: u.id,
            status: 'ABSENT',
            note: 'Tự động đánh dấu vắng mặt (không chấm công)',
          })),
          skipDuplicates: true,
        });
        console.log(`[CRON] ✅ Đã tạo ${absentUsers.length} bản ghi ABSENT.`);
      } else {
        console.log('[CRON] ✅ Tất cả nhân viên đã chấm công hôm nay.');
      }
    } catch (error) {
      console.error('[CRON] ❌ Lỗi khi chạy cron ABSENT:', error);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log('[CRON] 🟢 Cron job tự động ABSENT đã khởi động (chạy lúc 23:59 VN)');
};
