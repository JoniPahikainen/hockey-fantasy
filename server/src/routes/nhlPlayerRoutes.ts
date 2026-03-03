import { Router } from 'express';
import { getPlayerPool, getPlayerPoolWithPeriodPoints } from '../controllers/nhlPlayer.controller';
const router = Router();

router.get('/players', getPlayerPool);
router.get('/players/period', getPlayerPoolWithPeriodPoints);
export default router;