import { Response } from "express";
import * as service from "../services/price.service";
import { AuthRequest } from "../middleware/auth";

export const actionRegenerateStartPrices = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    await service.regenerateStartPrices(req.user!.userId);
    return res.json({ ok: true, message: "Start prices regenerated" });
  } catch (err) {
    console.error("Admin regenerateStartPrices:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to regenerate start prices" });
  }
};

export const actionResetSeasonPrices = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    await service.resetSeasonPrices(req.user!.userId);
    return res.json({
      ok: true,
      message: "Season prices reset to start prices",
    });
  } catch (err) {
    console.error("Admin resetSeasonPrices:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to reset season prices" });
  }
};

export const actionProcessPeriodPriceUpdate = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    await service.processPeriodPriceUpdate(req.user!.userId);
    return res.json({
      ok: true,
      message:
        "Daily price history rebuilt for the current scoring period (one closing price per player per day, through today).",
    });
  } catch (err) {
    console.error("Admin processPeriodPriceUpdate:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to rebuild daily price history" });
  }
};