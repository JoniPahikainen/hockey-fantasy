import { Router } from 'express';
import { getPlayerPool } from '../controllers/playerController';
const router = Router();

router.get('/players', getPlayerPool);
export default router;