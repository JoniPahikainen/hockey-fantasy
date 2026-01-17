import { Router } from 'express';
import { createUser, deleteUser, loginUser } from '../controllers/userController';

const router = Router();

router.post('/user/register', createUser);
router.delete('/user/:id', deleteUser);
router.post('/user/login', loginUser);

export default router;


