import { Request, Response } from "express";
import * as service from "../services/fantasyTeam.service";
import { ServiceError } from "../utils/errors";

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { team_name, user_id } = req.body;

    const team = await service.createTeam(team_name, user_id);

    return res.status(201).json({ ok: true, team });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const addPlayerToTeam = async (req: Request, res: Response) => {
  try {
    const { team_id, player_id } = req.body;
    const player = await service.addPlayerToTeam(team_id, player_id);
    return res.status(201).json({ ok: true, added: player });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }

    console.error("Error in addPlayerToTeam Controller:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const removePlayerFromTeam = async (req: Request, res: Response) => {
  try {
    const { team_id, player_id } = req.body;

    if (team_id === undefined || player_id === undefined) {
      return res.status(400).json({ ok: false, error: "Missing ids" });
    }

    const teamId = Number(team_id);
    const playerId = Number(player_id);

    if (!Number.isInteger(teamId) || !Number.isInteger(playerId)) {
      return res.status(400).json({ ok: false, error: "Invalid ids" });
    }

    const removed = await service.removePlayerFromTeam(teamId, playerId);

    return res.json({ ok: true, removed });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }

    console.error("Error in removePlayerFromTeam Controller:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getTeamPlayers = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.team_id);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ ok: false, error: "Invalid team id" });
    }

    const players = await service.getTeamPlayers(teamId);
    return res.json({ ok: true, players });

  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Controller Error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getTeamsByOwner = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ ok: false, error: "Missing user id" });
    }
    const userId = Number(user_id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ ok: false, error: "Invalid user id" });
    }
    const teams = await service.getTeamsByUserId(userId);

    return res.json({ ok: true, teams });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const saveLineup = async (req: Request, res: Response) => {
  const { team_id, playerIds } = req.body;

  if (!team_id || !Array.isArray(playerIds)) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing team_id or players" });
  }

  try {
    const budgetRemaining = await service.updateLineupProcess(
      team_id,
      playerIds,
    );

    return res.json({
      ok: true,
      message: "Lineup saved and budget updated",
      budget_remaining: budgetRemaining,
    });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error in saveLineup Controller:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getUserTeamWithPlayers = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.user_id);

    if (isNaN(userId)) {
      return res.status(400).json({ ok: false, error: "Invalid User ID" });
    }

    const teamInfo = await service.getUserTeamDetails(userId);

    return res.json({
      ok: true,
      team: teamInfo,
    });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Dashboard error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getOptimalLineups = async (req: Request, res: Response) => {
  try {
    const data = await service.getOptimalAndWorstLineups();

    return res.json({
      ok: true,
      ...data,
    });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching optimal lineups:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const teamId = Number(req.params.team_id);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ ok: false, error: "Invalid team id" });
    }

    const deleted = await service.deleteTeam(teamId);
    return res.json({ ok: true, deleted });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error deleting team:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};