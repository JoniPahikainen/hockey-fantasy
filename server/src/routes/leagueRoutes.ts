import { Router } from 'express';
import { createLeague, joinLeague, getLeagueStandings , getLeagueStandingsByPeriod, getCurrentPeriodStandings } from '../controllers/leagueController';

const router = Router();

router.post('/leagues', createLeague);
router.post('/leagues/join', joinLeague);
router.get('/leagues/:league_id/standings', getLeagueStandings);
router.get('/leagues/:league_id/standings/period/:period_id', getLeagueStandingsByPeriod);
router.get('/leagues/:league_id/standings/current', getCurrentPeriodStandings);

export default router;