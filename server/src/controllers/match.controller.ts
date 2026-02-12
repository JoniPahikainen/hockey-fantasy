import { Request, Response } from "express";
import * as service from "../services/match.service";

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({ ok: false, error: "Date parameter is required" });
    }

    const matches = await service.getMatchesByDate(date);
    
    return res.json({ ok: true, matches });
  } catch (err) {
    console.error("Error fetching matches:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};