import { Router } from 'express';
import { getMatches } from '../controllers/matchController';

const router = Router();

router.get('/matches/:date', getMatches);
export default router;


