import { Router } from 'express';
import {
  getPayslips, getMyPayslips, getPayslipById,
  generatePayslips, updatePayslip, confirmPayslip,
  markPayslipPaid, deletePayslip
} from './payroll.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getPayslips);
router.get('/my', getMyPayslips);
router.get('/:id', getPayslipById);
router.post('/generate', generatePayslips);
router.patch('/:id', updatePayslip);
router.patch('/:id/confirm', confirmPayslip);
router.patch('/:id/paid', markPayslipPaid);
router.delete('/:id', deletePayslip);

export default router;
