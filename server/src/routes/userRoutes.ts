import { Router } from 'express';
import { createUser, deleteUser, loginUser } from '../controllers/userController';

const router = Router();

router.post('/register', createUser);
router.delete('/:id', deleteUser);
router.post('/login', loginUser);

export default router;


