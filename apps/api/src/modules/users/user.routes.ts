import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, changePassword, updateProfile } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.patch('/me/password', changePassword);
router.patch('/me/profile', updateProfile);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
