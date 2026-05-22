import { Router } from 'express';
import { getRoles, createRole, updateRole, deleteRole, assignPermissions } from './role.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRoles);
router.post('/', createRole);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);
router.post('/:id/permissions', assignPermissions);

export default router;
