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

// Get full season standings for a league
export const getLeagueStandings = async (req: Request, res: Response) => {
  try {
    const { league_id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        t.team_id, 
        t.team_name, 
        u.username as owner_name, 
        COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) as total_points,
        RANK() OVER (ORDER BY COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) DESC) as rank      FROM league_members lm
      JOIN fantasy_teams t ON lm.team_id = t.team_id
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN roster_history rh ON rh.team_id = t.team_id
      LEFT JOIN player_game_stats pgs ON pgs.player_id = rh.player_id
      LEFT JOIN matches m ON m.match_id = pgs.match_id 
        AND m.scheduled_at::date = rh.game_date 
      WHERE lm.league_id = $1
      GROUP BY t.team_id, t.team_name, u.username
      ORDER BY total_points DESC;
      `,
      [league_id]
    );

    return res.json({ ok: true, standings: result.rows });
  } catch (err) {
    console.error("Error fetching full season standings:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get standings for a league filtered by a specific scoring period
export const getLeagueStandingsByPeriod = async (
  req: Request,
  res: Response
) => {
  try {
    const { league_id, period_id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        t.team_id,
        t.team_name,
        u.username AS owner_name,
        COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) AS period_points,
        RANK() OVER (ORDER BY COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) DESC) AS rank
      FROM league_members lm
      JOIN fantasy_teams t ON lm.team_id = t.team_id
      JOIN users u ON t.user_id = u.user_id
      JOIN scoring_periods sp ON sp.period_id = $2
      LEFT JOIN roster_history rh ON rh.team_id = t.team_id 
        AND rh.game_date BETWEEN sp.start_date AND sp.end_date
      LEFT JOIN player_game_stats pgs ON pgs.player_id = rh.player_id
      LEFT JOIN matches m ON m.match_id = pgs.match_id 
        AND m.scheduled_at::date = rh.game_date
      WHERE lm.league_id = $1 
      GROUP BY t.team_id, t.team_name, u.username
      ORDER BY period_points DESC
      `,
      [league_id, period_id]
    );

    return res.json({ ok: true, standings: result.rows });
  } catch (err) {
    console.error("Error fetching period standings:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};


// Get current scoring period standings for a league
export const getCurrentPeriodStandings = async (req: Request, res: Response) => {
  try {
    const { league_id } = req.params;

    const result = await pool.query(
      `
      WITH current_period AS (
        SELECT period_id FROM scoring_periods 
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
      )
      SELECT 
        t.team_id,
        t.team_name,
        u.username AS owner_name,
        COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) AS period_points,
        RANK() OVER (ORDER BY COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) DESC) AS rank
      FROM league_members lm
      JOIN fantasy_teams t ON lm.team_id = t.team_id
      JOIN users u ON t.user_id = u.user_id
      JOIN scoring_periods sp ON CURRENT_DATE BETWEEN sp.start_date AND sp.end_date
      LEFT JOIN roster_history rh ON rh.team_id = t.team_id 
        AND rh.game_date BETWEEN sp.start_date AND sp.end_date
      LEFT JOIN player_game_stats pgs ON pgs.player_id = rh.player_id
      LEFT JOIN matches m ON m.match_id = pgs.match_id AND m.scheduled_at::date = rh.game_date
      WHERE lm.league_id = $1
      GROUP BY t.team_id, t.team_name, u.username
      ORDER BY period_points DESC
      `,
      [league_id]
    );

    return res.json({ ok: true, standings: result.rows });
  } catch (err) {
    console.error("Error fetching current standings:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get leagues by user ID
export const getLeaguesByUserId = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      `
      SELECT l.league_id, l.name, l.creator_id
      FROM leagues l
      JOIN league_members lm ON l.league_id = lm.league_id
      JOIN fantasy_teams ft ON lm.team_id = ft.team_id
      WHERE ft.user_id = $1;
      `,
      [user_id]
    );
    return res.json({ ok: true, leagues: result.rows });
  } catch (err) {
    console.error("Error fetching leagues by user ID:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get current period
export const getCurrentPeriod = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT period_id, start_date, end_date
        FROM scoring_periods
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1;`
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "No current period found" });
    }
    return res.json({ ok: true, period: result.rows[0] });
  } catch (err) {
    console.error("Error fetching current period:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};