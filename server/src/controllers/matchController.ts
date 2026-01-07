import { Request, Response } from "express";
import pool from "../db";

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    const startRange = `${date} 12:00:00`;

    if (!date) {
      return res
        .status(400)
        .json({ ok: false, error: "Date parameter is required" });
    }

    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split("T")[0];
    const endRange = `${tomorrowString} 11:59:59`;

    const result = await pool.query(
      `SELECT 
                match_id, 
                home_team_abbrev, 
                away_team_abbrev, 
                TO_CHAR(scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE 'EET', 'HH24:MI') AS time,
                TO_CHAR(scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE 'EET', 'DD.MM') AS date,
                is_processed
             FROM matches
             WHERE scheduled_at >= $1::timestamp
               AND scheduled_at <= $2::timestamp
             ORDER BY scheduled_at ASC;`,
      [startRange, endRange]
    );

    return res.json({ ok: true, matches: result.rows });
  } catch (err) {
    console.error("Error fetching matches:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};
