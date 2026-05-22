import { Router } from 'express';
import { getActivityLogs } from './activity-log.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getActivityLogs);

export default router;
