import { Router } from "express";
import {
  createLeague,
  joinLeague,
  getLeagueStandings,
  getLeagueStandingsByPeriod,
  getCurrentPeriodStandings,
  getLeaguesByUserId,
  getCurrentPeriod,
  getDailyTeamPerformance,
} from "../controllers/leagueController";

const router = Router();

router.post("/leagues", createLeague);
router.post("/leagues/join", joinLeague);
router.get("/leagues/:league_id/standings", getLeagueStandings);
router.get("/leagues/:league_id/standings/period/:period_id", getLeagueStandingsByPeriod,);
router.get("/leagues/:league_id/standings/current", getCurrentPeriodStandings);
router.get("/leagues/user/:user_id", getLeaguesByUserId);
router.get("/leagues/current-period", getCurrentPeriod);
router.get("/teams/:team_id/performance/period/:period_id", getDailyTeamPerformance);
export default router;
