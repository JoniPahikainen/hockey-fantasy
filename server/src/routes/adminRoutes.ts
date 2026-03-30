import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getMarketOverview,
  getScoringRules,
  updatePlayer,
  getAdminTradeLockStatus,
  lockTrading,
  openTrading,
} from "../controllers/admin.controller";
import {
  actionRegenerateStartPrices,
  actionResetSeasonPrices,
  actionProcessPeriodPriceUpdate,
} from "../controllers/price.controller";
import { recalculateBaseRatings } from "../controllers/rating.controller";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/admin/players", getMarketOverview);
router.get("/admin/scoring-rules", getScoringRules);
router.patch("/admin/players/:id", updatePlayer);

router.post("/admin/economy/regenerate-start-prices", actionRegenerateStartPrices);
router.post("/admin/economy/reset-season-prices", actionResetSeasonPrices);
router.post("/admin/economy/process-period-prices", actionProcessPeriodPriceUpdate);

router.post("/admin/economy/recalculate-base-ratings", recalculateBaseRatings);
router.get("/admin/trade-lock/status", getAdminTradeLockStatus);
router.post("/admin/trade-lock/lock", lockTrading);
router.post("/admin/trade-lock/open", openTrading);

export default router;
