import { Request, Response } from "express";
import * as service from "../services/nhlPlayer.service";

export const getPlayerPool = async (req: Request, res: Response) => {
  try {
    const players = await service.getPlayerPool();
    return res.json({ ok: true, players });
  } catch (err) {
    console.error("Controller Error:", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
};