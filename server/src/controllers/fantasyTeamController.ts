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
