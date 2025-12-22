import { Router } from 'express';
import { createUser, deleteUser } from '../controllers/userController';

const router = Router();

router.post('/', createUser);
router.delete('/:id', deleteUser);

export default router;


