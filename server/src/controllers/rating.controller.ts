import { Response } from "express";
import * as service from "../services/rating.service";
import { AuthRequest } from "../middleware/auth";

export async function recalculateBaseRatings(req: AuthRequest, res: Response) {
  try {
    await service.recalculateBaseRatings();

    return res.json({
      ok: true,
      message:
        "Base ratings recalculated (weighted current season + last season)",
    });
  } catch (err) {
    console.error("Rating recalculateBaseRatings:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to recalculate base ratings",
    });
  }
}