import { Request, Response } from "express";
import pool from "../db";

// Create a new private league
export const createLeague = async (req: Request, res: Response) => {
  try {
    const { name, passcode, creator_id } = req.body;

    const result = await pool.query(
      `INSERT INTO leagues (name, passcode, creator_id)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [name, passcode, creator_id]
    );

    return res.status(201).json({ ok: true, league: result.rows[0] });
  } catch (err) {
    console.error("Error creating league:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Join a league using a passcode
export const joinLeague = async (req: Request, res: Response) => {
  try {
    const { team_id, league_id, passcode } = req.body;

    // 1. Verify league exists and passcode matches
    const leagueCheck = await pool.query(
      "SELECT passcode FROM leagues WHERE league_id = $1",
      [league_id]
    );

    if (leagueCheck.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "League not found" });
    }

    if (leagueCheck.rows[0].passcode !== passcode) {
      return res.status(401).json({ ok: false, error: "Invalid passcode" });
    }

    // 2. Add team to league
    await pool.query(
      "INSERT INTO league_members (league_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [league_id, team_id]
    );

    return res.json({ ok: true, message: "Successfully joined league" });
  } catch (err) {
    console.error("Error joining league:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get League Leaderboard (Standings)
export const getLeagueStandings = async (req: Request, res: Response) => {
  try {
    const { league_id } = req.params;

    const result = await pool.query(
      `SELECT 
        t.team_id, 
        t.team_name, 
        u.username as owner_name, 
        t.total_points,
        RANK() OVER (ORDER BY t.total_points DESC) as rank
       FROM league_members lm
       JOIN fantasy_teams t ON lm.team_id = t.team_id
       JOIN users u ON t.user_id = u.user_id
       WHERE lm.league_id = $1
       ORDER BY t.total_points DESC`,
      [league_id]
    );

    return res.json({ ok: true, standings: result.rows });
  } catch (err) {
    console.error("Error fetching standings:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};