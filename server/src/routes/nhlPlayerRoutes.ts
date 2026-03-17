import { Router } from "express";
import {
  getPlayerPool,
  getPlayerPoolWithPeriodPoints,
  getPlayerDetail,
} from "../controllers/nhlPlayer.controller";

const router = Router();

router.get("/players", getPlayerPool);
router.get("/players/period", getPlayerPoolWithPeriodPoints);
router.get("/players/:id", getPlayerDetail);

export default router;