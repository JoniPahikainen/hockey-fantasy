import { Request, Response } from "express";
import pool from "../db";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { team_name, user_id } = req.body;
    console .log("Creating fantasy team with data:", { team_name, user_id });
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
  //TODO: Implement adding player to fantasy team
};

export const removePlayerFromTeam = async (req: Request, res: Response) => {
  //TODO: Implement removing player from fantasy team
};