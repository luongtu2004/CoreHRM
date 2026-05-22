import { Router } from 'express';
import { getDashboardSummary, getAttendanceWeek } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/attendance-week', getAttendanceWeek);

export default router;
