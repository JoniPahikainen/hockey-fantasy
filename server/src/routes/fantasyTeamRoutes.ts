import { Router } from "express";
import {
  createTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
  getTeamPlayers,
  getTeamPlayersAtLastTradeLock,
  getTeamsByOwner,
  saveLineup,
  setCaptain,
  getCaptainForDate,
  getTradeLockStatus,
  getOptimalLineups,
  deleteTeam,
  getTeamLastNightPoints
} from "../controllers/fantasyTeam.controller";
const router = Router();

router.post("/fantasy-teams", createTeam);
router.post("/fantasy-teams/add-player", addPlayerToTeam);
router.post("/fantasy-teams/remove-player", removePlayerFromTeam);
router.get("/fantasy-teams/:team_id/players", getTeamPlayers);
router.get("/fantasy-teams/:team_id/players/last-trade-lock", getTeamPlayersAtLastTradeLock);
router.get("/fantasy-teams/owner/:user_id", getTeamsByOwner);
router.post("/fantasy-teams/save-lineup", saveLineup);
router.patch("/fantasy-teams/:team_id/captain", setCaptain);
router.get("/fantasy-teams/:team_id/captain", getCaptainForDate);
router.get("/fantasy-teams/trade-lock/status", getTradeLockStatus);
router.get("/fantasy-teams/optimal-lineups", getOptimalLineups);
router.delete("/fantasy-teams/:team_id", deleteTeam);
router.get("/fantasy-teams/:team_id/last-night-points", getTeamLastNightPoints);

export default router;
