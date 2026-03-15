import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getPlayerPool,
  getPlayerPoolWithPeriodPoints,
  getPlayerDetail,
} from "../controllers/nhlPlayer.controller";

const router = Router();

router.get("/players", getPlayerPool);
router.get("/players/period", getPlayerPoolWithPeriodPoints);
router.get("/players/:id", authenticate, getPlayerDetail);

export default router;