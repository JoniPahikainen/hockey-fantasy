import * as repo from "../repositories/fantasyTeam.repository";
import pool from "../db";
import { ServiceError } from "../utils/errors";

type TradeLockStatus = {
  locked: boolean;
  reason: string;
  lock_window_minutes: number;
  next_match_at: string | null;
  lock_starts_at: string | null;
  last_lock_at: string | null;
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
  const wouldBlock = await repo.wouldRemoveCaptainWithOthersRemaining(teamId, playerId);
  if (wouldBlock) {
    throw new ServiceError(
      "Select a different captain before removing this player.",
      400,
    );
  }
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
  if (status.locked) {
    const current = await repo.getTeamPlayers(teamId);
    return current.rows;
  }

  let snapshotAt = status.last_lock_at;
  if (!snapshotAt) {
    const effectiveLockWindowMinutes = Number(status.lock_window_minutes || 60);
    const snapshotRes = await repo.getLastProcessedTradeLockSnapshotAt(
      effectiveLockWindowMinutes,
    );
    const derived = snapshotRes.rows[0]?.snapshot_at;
    snapshotAt =
      derived != null ? new Date(derived).toISOString() : null;
  }
  if (!snapshotAt) {
    const current = await repo.getTeamPlayers(teamId);
    return current.rows;
  }

  const result = await repo.getTeamPlayersAtTimestamp(teamId, snapshotAt);
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

    const oldBudgetRes = await client.query(
      "SELECT budget_remaining FROM fantasy_teams WHERE team_id = $1 FOR UPDATE",
      [teamId],
    );
    const oldBudgetRemaining = Number(oldBudgetRes.rows[0]?.budget_remaining ?? 0);
    const oldSpent = await repo.getTeamBudgetSpent(client, teamId);

    await repo.markRemovedPlayers(client, teamId, playerIds);
    await repo.insertOrReactivatePlayers(client, teamId, playerIds);

    const newSpent = await repo.getTeamBudgetSpent(client, teamId);
    const newBudgetRemaining = oldBudgetRemaining + oldSpent - newSpent;

    if (newBudgetRemaining < 0) {
      throw new ServiceError("Not enough budget for this lineup", 400);
    }

    await client.query(
      "UPDATE fantasy_teams SET budget_remaining = $1 WHERE team_id = $2",
      [newBudgetRemaining, teamId],
    );

    const capCheck = await client.query(
      `
      SELECT COUNT(*)::int AS c,
             COALESCE(SUM(CASE WHEN is_captain THEN 1 ELSE 0 END), 0)::int AS cap
      FROM fantasy_team_players
      WHERE team_id = $1 AND COALESCE(is_active, true)
      `,
      [teamId],
    );
    const { c, cap } = capCheck.rows[0];
    if (Number(c) > 0 && Number(cap) !== 1) {
      throw new ServiceError(
        "Your lineup must include exactly one captain. Choose a captain before saving.",
        400,
      );
    }

    await client.query("COMMIT");
    return newBudgetRemaining;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const setCaptain = async (teamId: number, playerId: number) => {
  await assertTradingOpen();
  const teamCheck = await repo.teamExists(teamId);
  if (teamCheck.rowCount === 0) {
    throw new ServiceError("Team not found", 404);
  }
  if (!Number.isInteger(playerId)) {
    throw new ServiceError("Captain is required: choose a player on your roster.", 400);
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
  const cfgRes = await repo.getTradeLockConfig();

  const cfg = cfgRes.rows[0] || {
    is_enabled: true,
    lock_window_minutes: 60,
    manual_lock: false,
    manual_unlock_until: null,
    last_lock_at: null,
  };

  if (cfg.manual_lock) {
    if (!cfg.last_lock_at) {
      await repo.setTradeLockLastLockAt(new Date().toISOString());
      cfg.last_lock_at = new Date().toISOString();
    }
    return {
      locked: true,
      reason: "locked",
      lock_window_minutes: Number(cfg.lock_window_minutes || 60),
      next_match_at: null,
      lock_starts_at: null,
      last_lock_at: cfg.last_lock_at ? new Date(cfg.last_lock_at).toISOString() : null,
      manual_unlock_until: null,
    };
  }

  return {
    locked: false,
    reason: "open",
    lock_window_minutes: Number(cfg.lock_window_minutes || 60),
    next_match_at: null,
    lock_starts_at: null,
    last_lock_at: cfg.last_lock_at ? new Date(cfg.last_lock_at).toISOString() : null,
    manual_unlock_until: null,
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

export const setTradeLockState = async (locked: boolean) => {
  const lockAt = locked ? new Date().toISOString() : null;
  if (locked && lockAt) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const invalid = await repo.getTeamIdsWithInvalidCaptainCount(client);
      if (invalid.rows.length > 0) {
        throw new ServiceError(
          "Cannot lock trading: every team with a roster must have exactly one captain.",
          400,
        );
      }
      await repo.syncRosterHistoryFromCurrentPlayers(client, lockAt);
      await repo.syncCaptainHistoryFromLock(client, lockAt);
      await repo.setTradeLockStateWithClient(client, true, lockAt);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } else {
    await repo.setTradeLockState(false, null);
  }
  return getTradeLockStatus();
};
