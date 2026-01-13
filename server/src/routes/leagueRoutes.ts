import { Router } from 'express';
import { createLeague, joinLeague, getLeagueStandings } from '../controllers/leagueController';
import { resolveObjectURL } from 'node:buffer';

const router = Router();

router.post('/leagues', createLeague);
router.post('/leagues/join', joinLeague);
router.get('/leagues/:league_id/standings', getLeagueStandings);

export default router;