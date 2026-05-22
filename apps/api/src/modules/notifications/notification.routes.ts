import { Router } from 'express';
import {
  getMyNotifications, getUnreadCount,
  markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications
} from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/all', deleteAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
