import { Router } from 'express';
import {
  getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType,
  getLeaveRequests, getMyLeaveRequests, createLeaveRequest,
  approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest
} from './leave.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Leave types
router.get('/types', getLeaveTypes);
router.post('/types', createLeaveType);
router.patch('/types/:id', updateLeaveType);
router.delete('/types/:id', deleteLeaveType);

// Leave requests
router.get('/', getLeaveRequests);
router.get('/my', getMyLeaveRequests);
router.post('/', createLeaveRequest);
router.patch('/:id/approve', approveLeaveRequest);
router.patch('/:id/reject', rejectLeaveRequest);
router.patch('/:id/cancel', cancelLeaveRequest);

export default router;
