import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getMarketOverview,
  getPlayerDetail,
  updatePlayer,
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
router.get("/admin/players/:id", getPlayerDetail);
router.patch("/admin/players/:id", updatePlayer);

router.post("/admin/economy/regenerate-start-prices", actionRegenerateStartPrices);
router.post("/admin/economy/reset-season-prices", actionResetSeasonPrices);
router.post("/admin/economy/process-period-prices", actionProcessPeriodPriceUpdate);

router.post("/admin/economy/recalculate-base-ratings", recalculateBaseRatings);

export default router;
