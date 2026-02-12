import { Router } from 'express';
import { getPlayerPool } from '../controllers/nhlPlayer.controller';
const router = Router();

router.get('/players', getPlayerPool);
export default router;