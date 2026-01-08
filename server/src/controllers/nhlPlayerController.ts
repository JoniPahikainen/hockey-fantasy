import { Request, Response } from "express";
import pool from "../db";

// matchController.ts tai vastaava
export const getPlayerPool = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.player_id AS id,
        p.first_name || ' ' || p.last_name AS name,
        p.position AS pos,
        p.team_abbrev AS team,
        p.current_price AS salary,
        COALESCE(SUM(pgs.points_earned), 0) AS points,
        t.primary_color AS color
      FROM players p
      LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
      LEFT JOIN real_teams t ON p.team_abbrev = t.abbreviation
      GROUP BY p.player_id, p.first_name, p.last_name, p.position, p.team_abbrev, p.current_price, t.primary_color
      ORDER BY points DESC;
    `);

    res.json({ ok: true, players: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Database error" });
  }
};