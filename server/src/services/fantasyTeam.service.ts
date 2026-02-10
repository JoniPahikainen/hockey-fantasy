import * as repo from "../repositories/fantasyTeam.repository";
import pool from "../db";
import { ServiceError } from "../utils/errors";

export const createTeam = async (teamName: string, userId: number) => {
  const result = await repo.createTeam(teamName, userId);
  return result.rows[0];
};

export const addPlayerToTeam = async (teamId: number, playerId: number) => {
  const exists = await repo.findPlayerInTeam(teamId, playerId);

  if (exists.rowCount && exists.rowCount > 0) {
    throw new ServiceError("Player already in team", 400);
  }

  const result = await repo.insertPlayerToTeam(teamId, playerId);
  return result.rows[0];
};

export const removePlayerFromTeam = async (
  teamId: number,
  playerId: number,
) => {
  const result = await repo.removePlayerFromTeam(teamId, playerId);
  if (result.rowCount === 0) {
    throw new ServiceError("Player not in team", 404);
  }
  return result.rows[0];
};

export const getTeamPlayers = async (teamId: number) => {
  const teamCheck = await repo.teamExists(teamId);

  if (teamCheck.rowCount === 0) {
    throw new ServiceError("Team not found", 404);
  }

  const result = await repo.getTeamPlayers(teamId);

  return result.rows;
};

export const getTeamsByUserId = async (userId: number) => {
  const result = await repo.getTeamsByOwner(userId);
  return result.rows;
};

export const updateLineupProcess = async (
  teamId: number,
  playerIds: number[],
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await repo.deleteTeamPlayers(client, teamId);

    if (playerIds.length > 0) {
      await repo.insertTeamPlayers(client, teamId, playerIds);
    }

    const newBudget = await repo.updateTeamBudget(client, teamId, playerIds);

    await client.query("COMMIT");
    return newBudget;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getUserTeamDetails = async (userId: number) => {
  const result = await repo.getTeamAndPlayersRaw(userId);

  if (result.rows.length === 0) {
    return null;
  }
  const firstRow = result.rows[0];

  return {
    team_id: firstRow.team_id,
    team_name: firstRow.team_name,
    budget_remaining: firstRow.budget_remaining,
    total_points: firstRow.team_total_points,
    players: result.rows
      .filter((row: any) => row.player_id !== null)
      .map((row: any) => ({
        id: row.player_id,
        name: row.name,
        pos: row.pos,
        team: row.team,
        abbrev: row.abbrev,
        color: row.color,
        salary: row.salary,
        points: parseFloat(row.points),
      })),
  };
};

export const getOptimalAndWorstLineups = async () => {
  const [best, worst] = await Promise.all([
    repo.getRankedLineup("DESC"),
    repo.getRankedLineup("ASC"),
  ]);

  return { best, worst };
};
