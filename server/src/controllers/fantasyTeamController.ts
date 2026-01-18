import { Request, Response } from "express";
import pool from "../db";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { team_name, user_id } = req.body;
    console.log("Creating fantasy team with data:", { team_name, user_id });
    const result = await pool.query(
      `INSERT INTO fantasy_teams (team_name, user_id)
       VALUES ($1, $2)
       RETURNING team_id, team_name, user_id;`,
      [team_name, user_id]
    );
    return res.status(201).json({ ok: true, team: result.rows[0] });
  } catch (err) {
    console.error("Error creating fantasy team:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const addPlayerToTeam = async (req: Request, res: Response) => {
  try {
    const { team_id, player_id } = req.body;

    const checkExist = await pool.query(
      "SELECT 1 FROM fantasy_team_players WHERE team_id = $1 AND player_id = $2",
      [team_id, player_id]
    );

    if (checkExist.rowCount && checkExist.rowCount > 0) {
      return res
        .status(400)
        .json({ ok: false, error: "Player already in team" });
    }

    const result = await pool.query(
      `INSERT INTO fantasy_team_players (team_id, player_id)
       VALUES ($1, $2)
       RETURNING *;`,
      [team_id, player_id]
    );

    return res.status(201).json({ ok: true, added: result.rows[0] });
  } catch (err) {
    console.error("Error adding player:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const removePlayerFromTeam = async (req: Request, res: Response) => {
  try {
    const { team_id, player_id } = req.body;

    const result = await pool.query(
      `DELETE FROM fantasy_team_players 
       WHERE team_id = $1 AND player_id = $2
       RETURNING player_id;`,
      [team_id, player_id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ ok: false, error: "Player not found in this team" });
    }

    return res.json({ ok: true, message: "Player removed from team" });
  } catch (err) {
    console.error("Error removing player:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getTeamPlayers = async (req: Request, res: Response) => {
  try {
    const { team_id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.player_id, 
        (p.first_name || ' ' || p.last_name) AS name, 
        p.position AS pos, 
        p.team_abbrev AS team,
        p.current_price AS salary,
        rt.primary_color AS color,
        COALESCE(SUM(pgs.points_earned), 0) AS points
       FROM players p
       JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
       JOIN fantasy_team_players ftp ON p.player_id = ftp.player_id
       LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
       WHERE ftp.team_id = $1
       GROUP BY p.player_id, p.first_name, p.last_name, p.position, p.team_abbrev, p.current_price, rt.primary_color;`,
      [team_id]
    );

    return res.json({ ok: true, players: result.rows });
  } catch (err) {
    console.error("Error fetching team players:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getTeamsByOwner = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT 
        team_id, 
        team_name, 
        user_id, 
        budget_remaining, 
        total_points, 
        created_at
       FROM fantasy_teams
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [user_id]
    );

    return res.json({
      ok: true,
      teams: result.rows,
    });
  } catch (err) {
    console.error("Error fetching teams by user:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const saveLineup = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { team_id, playerIds } = req.body;

    if (!team_id || !Array.isArray(playerIds)) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing team_id or players" });
    }

    await client.query("BEGIN");

    await client.query("DELETE FROM fantasy_team_players WHERE team_id = $1", [
      team_id,
    ]);

    if (playerIds.length > 0) {
      const insertValues = playerIds
        .map((pid: number) => `(${team_id}, ${pid})`)
        .join(",");
      await client.query(
        `INSERT INTO fantasy_team_players (team_id, player_id) VALUES ${insertValues}`
      );
    }

    const budgetUpdate = await client.query(
      `UPDATE fantasy_teams 
       SET budget_remaining = 2000000 - (
         SELECT COALESCE(SUM(current_price), 0) 
         FROM players 
         WHERE player_id = ANY($1)
       )
       WHERE team_id = $2
       RETURNING budget_remaining`,
      [playerIds, team_id]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Lineup saved and budget updated",
      budget_remaining: budgetUpdate.rows[0].budget_remaining,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error saving lineup:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getUserTeamWithPlayers = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT 
        ft.team_id, 
        ft.team_name, 
        ft.budget_remaining, 
        ft.total_points AS team_total_points,
        p.player_id, 
        (p.first_name || ' ' || p.last_name) AS name, 
        p.position AS pos, 
        p.team_abbrev AS team,
        rt.abbreviation AS abbrev,
        rt.primary_color AS color,
        p.current_price AS salary,
        COALESCE(SUM(pgs.points_earned), 0) AS points
       FROM fantasy_teams ft
       LEFT JOIN fantasy_team_players ftp ON ft.team_id = ftp.team_id
       LEFT JOIN players p ON ftp.player_id = p.player_id
       LEFT JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
       LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
       WHERE ft.user_id = $1
       GROUP BY ft.team_id, p.player_id, rt.abbreviation, rt.primary_color
       ORDER BY ft.created_at DESC`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.json({ ok: true, team: null });
    }

    const teamInfo = {
      team_id: result.rows[0].team_id,
      team_name: result.rows[0].team_name,
      budget_remaining: result.rows[0].budget_remaining,
      total_points: result.rows[0].team_total_points,
      players: result.rows
        .filter((row: { player_id: null; }) => row.player_id !== null)
        .map((row: { player_id: any; name: any; pos: any; team: any; abbrev: any; color: any; salary: any; points: string; }) => ({
          id: row.player_id,
          name: row.name,
          pos: row.pos,
          team: row.team,
          abbrev: row.abbrev,
          color: row.color,
          salary: row.salary,
          points: parseFloat(row.points)
        }))
    };

    return res.json({ ok: true, team: teamInfo });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getOptimalLineups = async (req: Request, res: Response) => {
  try {
    const query = (order: 'DESC' | 'ASC') => `
      WITH last_match_date AS (
        SELECT MAX(scheduled_at) as last_date FROM matches WHERE is_processed = true
      ),
      ranked_players AS (
        SELECT 
          p.player_id,
          (p.first_name || ' ' || p.last_name) AS name,
          p.position AS pos,
          p.team_abbrev AS abbrev,
          rt.primary_color AS color,
          pgs.points_earned AS points,
          pgs.goals, 
          pgs.assists, 
          pgs.saves,
          CASE 
            WHEN p.team_abbrev = m.home_team_abbrev THEN m.away_score 
            ELSE m.home_score 
          END as goals_against,
          CASE 
            WHEN (p.team_abbrev = m.home_team_abbrev AND m.home_score > m.away_score) OR 
                 (p.team_abbrev = m.away_team_abbrev AND m.away_score > m.home_score) 
            THEN true ELSE false 
          END as is_win,
          ROW_NUMBER() OVER(PARTITION BY p.position ORDER BY pgs.points_earned ${order}) as rank
        FROM players p
        JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
        JOIN player_game_stats pgs ON p.player_id = pgs.player_id
        JOIN matches m ON pgs.match_id = m.match_id
        WHERE m.scheduled_at >= (SELECT last_date - INTERVAL '24 hours' FROM last_match_date)
          AND m.is_processed = true
      )
      SELECT * FROM ranked_players
      WHERE (pos = 'F' AND rank <= 3)
         OR (pos = 'D' AND rank <= 2)
         OR (pos = 'G' AND rank <= 1)
      ORDER BY pos DESC, points ${order};
    `;

    const [best, worst] = await Promise.all([
      pool.query(query('DESC')),
      pool.query(query('ASC'))
    ]);

    return res.json({ ok: true, best: best.rows, worst: worst.rows });
  } catch (err) {
    console.error("Error fetching optimal lineups:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};