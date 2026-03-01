import { Response } from "express";
import * as service from "../services/admin.service";
import { AuthRequest } from "../middleware/auth";

export const getMarketOverview = async (req: AuthRequest, res: Response) => {
  try {
    const raw = (req.query.season as string)?.toLowerCase();
    const scope =
      raw === "period" ? "period" : raw === "current" ? "current" : "all";
    const players = await service.getMarketOverview(scope);
    return res.json({ ok: true, players });
  } catch (err) {
    console.error("Admin getMarketOverview:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load market overview" });
  }
};

export const getPlayerDetail = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "", 10);
    if (isNaN(id))
      return res.status(400).json({ ok: false, error: "Invalid player ID" });
    const raw = (req.query.season as string)?.toLowerCase();
    const scope =
      raw === "period" ? "period" : raw === "current" ? "current" : "all";
    const detail = await service.getPlayerDetail(id, scope);
    if (!detail)
      return res.status(404).json({ ok: false, error: "Player not found" });
    return res.json({ ok: true, player: detail });
  } catch (err) {
    console.error("Admin getPlayerDetail:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load player detail" });
  }
};

export const updatePlayer = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? "", 10);
    if (isNaN(id))
      return res.status(400).json({ ok: false, error: "Invalid player ID" });
    const { base_rating, start_price, is_injured } = req.body;
    const updates: {
      base_rating?: number;
      start_price?: number;
      is_injured?: boolean;
    } = {};
    if (typeof base_rating === "number") updates.base_rating = base_rating;
    if (typeof start_price === "number") updates.start_price = start_price;
    if (typeof is_injured === "boolean") updates.is_injured = is_injured;
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "No valid fields to update" });
    }
    const userId = req.user!.userId;
    const updated = await service.updatePlayerMarket(userId, id, updates);
    if (!updated)
      return res.status(404).json({ ok: false, error: "Player not found" });
    return res.json({ ok: true, player: updated });
  } catch (err) {
    console.error("Admin updatePlayer:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to update player" });
  }
};
