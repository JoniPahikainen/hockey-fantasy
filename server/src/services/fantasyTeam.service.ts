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

export const updateLineupProcess = async (teamId: number, playerIds: number[]) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await repo.markRemovedPlayers(client, teamId, playerIds);
    await repo.insertOrReactivatePlayers(client, teamId, playerIds);
    const totalSpent = await repo.getTeamBudgetSpent(client, teamId);

    await client.query("COMMIT");
    return totalSpent;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const setCaptain = async (
  teamId: number,
  playerId: number | null,
) => {
  const teamCheck = await repo.teamExists(teamId);
  if (teamCheck.rowCount === 0) {
    throw new ServiceError("Team not found", 404);
  }
  await repo.setTeamCaptainStandalone(teamId, playerId);
};

export const getCaptainForDate = async (
  teamId: number,
  date: string,
): Promise<number | null> => {
  const teamCheck = await repo.teamExists(teamId);
  if (teamCheck.rowCount === 0) {
    throw new ServiceError("Team not found", 404);
  }
  return repo.getCaptainForDate(teamId, date);
};

export const getOptimalAndWorstLineups = async () => {
  const [best, worst] = await Promise.all([
    repo.getRankedLineup("DESC"),
    repo.getRankedLineup("ASC"),
  ]);

  return { best, worst };
};

export const deleteTeam = async (teamId: number) => {
  const result = await repo.deleteTeam(teamId);
  if (result.rowCount === 0) {
    throw new ServiceError("Team not found", 404);
  }
  return result.rows[0];
};

export const getTeamLastNightPoints = async (teamId: number) => {
  const result = await repo.getTeamLastNightPoints(teamId);
  return result.rows[0];
};
