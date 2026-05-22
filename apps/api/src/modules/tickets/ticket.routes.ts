import { Router } from 'express';
import { getTickets, getTicketById, createTicket, updateTicket, deleteTicket, resolveTicket } from './ticket.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.patch('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/resolve', resolveTicket);

export default router;
