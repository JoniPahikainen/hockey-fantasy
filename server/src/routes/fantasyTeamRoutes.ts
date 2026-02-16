import { Router } from "express";
import {
  createTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
  getTeamPlayers,
  getTeamsByOwner,
  saveLineup,
  getUserTeamWithPlayers,
  getOptimalLineups,
  deleteTeam
} from "../controllers/fantasyTeam.controller";
const router = Router();

router.post("/fantasy-teams", createTeam);
router.post("/fantasy-teams/add-player", addPlayerToTeam);
router.post("/fantasy-teams/remove-player", removePlayerFromTeam);
router.get("/fantasy-teams/:team_id/players", getTeamPlayers);
router.get("/fantasy-teams/owner/:user_id", getTeamsByOwner);
router.post("/fantasy-teams/save-lineup", saveLineup);
router.get("/fantasy-teams/user-dashboard/:user_id", getUserTeamWithPlayers);
router.get("/fantasy-teams/optimal-lineups", getOptimalLineups);
router.delete("/fantasy-teams/:team_id", deleteTeam);

export default router;
