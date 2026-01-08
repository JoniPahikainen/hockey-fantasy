import { Router } from 'express';
import { getPlayerPool } from '../controllers/nhlPlayerController';
const router = Router();

router.get('/players', getPlayerPool);
export default router;