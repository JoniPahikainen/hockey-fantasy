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

export const getScoringRules = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await service.getScoringRules();
    return res.json({ ok: true, ...data });
  } catch (err) {
    console.error("Admin getScoringRules:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to load scoring rules" });
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

export const getAdminTradeLockStatus = async (_req: AuthRequest, res: Response) => {
  try {
    const status = await service.getTradeLockStatus();
    return res.json({ ok: true, status });
  } catch (err) {
    console.error("Admin getAdminTradeLockStatus:", err);
    return res.status(500).json({ ok: false, error: "Failed to load trade lock status" });
  }
};

export const lockTrading = async (_req: AuthRequest, res: Response) => {
  try {
    const status = await service.lockTrading();
    return res.json({ ok: true, message: "Trading locked.", status });
  } catch (err) {
    console.error("Admin lockTrading:", err);
    return res.status(500).json({ ok: false, error: "Failed to lock trading" });
  }
};

export const openTrading = async (_req: AuthRequest, res: Response) => {
  try {
    const status = await service.openTrading();
    return res.json({ ok: true, message: "Trading opened.", status });
  } catch (err) {
    console.error("Admin openTrading:", err);
    return res.status(500).json({ ok: false, error: "Failed to open trading" });
  }
};
