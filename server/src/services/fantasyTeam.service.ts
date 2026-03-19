import * as repo from "../repositories/fantasyTeam.repository";
import pool from "../db";
import { ServiceError } from "../utils/errors";

type TradeLockStatus = {
  locked: boolean;
  reason: string;
  lock_window_minutes: number;
  next_match_at: string | null;
  lock_starts_at: string | null;
  manual_unlock_until: string | null;
};

export const createTeam = async (teamName: string, userId: number) => {
  const result = await repo.createTeam(teamName, userId);
  return result.rows[0];
};

export const addPlayerToTeam = async (teamId: number, playerId: number) => {
  await assertTradingOpen();
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
  await assertTradingOpen();
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

export const getTeamPlayersAtLastTradeLock = async (teamId: number) => {
  const teamCheck = await repo.teamExists(teamId);
  if (teamCheck.rowCount === 0) {
    throw new ServiceError("Team not found", 404);
  }

  const status = await getTradeLockStatus();
  if (!status.lock_starts_at) {
    const current = await repo.getTeamPlayers(teamId);
    return current.rows;
  }

  const result = await repo.getTeamPlayersAtTimestamp(teamId, status.lock_starts_at);
  return result.rows;
};

export const getTeamsByUserId = async (userId: number) => {
  const result = await repo.getTeamsByOwner(userId);
  return result.rows;
};

export const updateLineupProcess = async (teamId: number, playerIds: number[]) => {
  await assertTradingOpen();
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
  await assertTradingOpen();
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

export const getTradeLockStatus = async (): Promise<TradeLockStatus> => {
  const [cfgRes, nextRes] = await Promise.all([
    repo.getTradeLockConfig(),
    repo.getFirstUnprocessedMatchTime(),
  ]);

  const cfg = cfgRes.rows[0] || {
    is_enabled: true,
    lock_window_minutes: 60,
    manual_lock: false,
    manual_unlock_until: null,
  };

  const now = new Date();
  const nextMatchAt = nextRes.rows[0]?.next_match_at
    ? new Date(nextRes.rows[0].next_match_at)
    : null;
  const lockStartsAt = nextMatchAt
    ? new Date(nextMatchAt.getTime() - Number(cfg.lock_window_minutes || 60) * 60_000)
    : null;
  const manualUnlockUntil = cfg.manual_unlock_until
    ? new Date(cfg.manual_unlock_until)
    : null;

  if (!cfg.is_enabled) {
    return {
      locked: false,
      reason: "disabled",
      lock_window_minutes: Number(cfg.lock_window_minutes || 60),
      next_match_at: nextMatchAt ? nextMatchAt.toISOString() : null,
      lock_starts_at: lockStartsAt ? lockStartsAt.toISOString() : null,
      manual_unlock_until: manualUnlockUntil ? manualUnlockUntil.toISOString() : null,
    };
  }

  if (cfg.manual_lock) {
    return {
      locked: true,
      reason: "manual_lock",
      lock_window_minutes: Number(cfg.lock_window_minutes || 60),
      next_match_at: nextMatchAt ? nextMatchAt.toISOString() : null,
      lock_starts_at: lockStartsAt ? lockStartsAt.toISOString() : null,
      manual_unlock_until: manualUnlockUntil ? manualUnlockUntil.toISOString() : null,
    };
  }

  if (manualUnlockUntil && now < manualUnlockUntil) {
    return {
      locked: false,
      reason: "manual_unlock_window",
      lock_window_minutes: Number(cfg.lock_window_minutes || 60),
      next_match_at: nextMatchAt ? nextMatchAt.toISOString() : null,
      lock_starts_at: lockStartsAt ? lockStartsAt.toISOString() : null,
      manual_unlock_until: manualUnlockUntil.toISOString(),
    };
  }

  if (!nextMatchAt || !lockStartsAt) {
    return {
      locked: false,
      reason: "no_unprocessed_matches",
      lock_window_minutes: Number(cfg.lock_window_minutes || 60),
      next_match_at: null,
      lock_starts_at: null,
      manual_unlock_until: manualUnlockUntil ? manualUnlockUntil.toISOString() : null,
    };
  }

  const locked = now >= lockStartsAt;
  return {
    locked,
    reason: locked ? "pregame_lock" : "open",
    lock_window_minutes: Number(cfg.lock_window_minutes || 60),
    next_match_at: nextMatchAt.toISOString(),
    lock_starts_at: lockStartsAt.toISOString(),
    manual_unlock_until: manualUnlockUntil ? manualUnlockUntil.toISOString() : null,
  };
};

export const assertTradingOpen = async () => {
  const status = await getTradeLockStatus();
  if (status.locked) {
    throw new ServiceError(
      `Trading is locked (${status.reason}). Next match: ${status.next_match_at ?? "n/a"}`,
      423,
    );
  }
};

export const openTradeLockAfterSeed = async () => {
  await repo.markTradeOpenAfterSeed();
};
