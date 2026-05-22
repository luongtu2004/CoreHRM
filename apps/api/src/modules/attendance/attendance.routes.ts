import { Router } from 'express';
import { checkIn, checkOut, getMyAttendance, getAllAttendance } from './attendance.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/my', getMyAttendance);
router.get('/', getAllAttendance);

export default router;
