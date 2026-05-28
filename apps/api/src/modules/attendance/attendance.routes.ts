import { Router } from 'express';
import { checkIn, checkOut, getMyAttendance, getAllAttendance, adminCorrectAttendance, deleteAttendance } from './attendance.controller';
import { getOfficeSettings, updateOfficeSettings } from './office-settings.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { uploadSelfie } from '../../config/upload';

const router = Router();

router.use(authenticate);

// Nhân viên: check-in/out kèm ảnh selfie (field name: "photo")
router.post('/check-in', uploadSelfie.single('photo'), checkIn);
router.post('/check-out', uploadSelfie.single('photo'), checkOut);
router.get('/my', getMyAttendance);

// Admin: xem tất cả (có filter theo ngày và userId)
router.get('/', getAllAttendance);

// Admin: sửa / tạo thủ công / xóa bản ghi chấm công
router.post('/admin/correct', adminCorrectAttendance);
router.delete('/:id', deleteAttendance);

// Office settings (GPS config)
router.get('/office-settings', getOfficeSettings);
router.put('/office-settings', updateOfficeSettings);

export default router;

