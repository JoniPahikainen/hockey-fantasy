import { Router } from 'express';
import { getMatches } from '../controllers/match.controller';

const router = Router();

router.get('/matches/:date', getMatches);
export default router;


