import { Request, Response } from "express";
import * as service from "../services/nhlPlayer.service";
import * as adminService from "../services/admin.service";

export const getPlayerPool = async (req: Request, res: Response) => {
  try {
    const players = await service.getPlayerPool();
    return res.json({ ok: true, players });
  } catch (err) {
    console.error("Controller Error:", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
};

export const getPlayerPoolWithPeriodPoints = async (req: Request, res: Response) => {
  try {
    const players = await service.getPlayerPoolWithPeriodPoints();
    return res.json({ ok: true, players });
  } catch (err) {
    console.error("Controller Error:", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
};

export const getPlayerDetail = async (req: Request, res: Response) => {
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
    console.error("getPlayerDetail:", err);
    return res.status(500).json({ ok: false, error: "Failed to load player detail" });
  }
};