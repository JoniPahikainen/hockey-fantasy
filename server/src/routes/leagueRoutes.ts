import { Router } from "express";
import {
  createLeague,
  joinLeague,
  leaveLeague,
  getLeagueStandings,
  getLeagueStandingsByPeriod,
  getLeaguesByUserId,
  getCurrentPeriod,
  getDailyTeamPerformance,
  getDailyPlayerBreakdown,
} from "../controllers/league.controller";

const router = Router();

router.post("/leagues", createLeague);
router.post("/leagues/join", joinLeague);
router.post("/leagues/:league_id/leave", leaveLeague);
router.get("/leagues/:league_id/standings", getLeagueStandings);
router.get("/leagues/:league_id/standings/period/:period_id", getLeagueStandingsByPeriod,);
router.get("/leagues/user/:user_id", getLeaguesByUserId);
router.get("/leagues/current-period", getCurrentPeriod);
router.get("/leagues/:team_id/performance/period/:period_id", getDailyTeamPerformance);
router.get("/leagues/:team_id/performance/day/:date", getDailyPlayerBreakdown);
export default router;
    