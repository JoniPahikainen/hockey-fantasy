import pool from "../db";
import { ServiceError } from "../utils/errors";

export const createTeam = (teamName: string, userId: number) => {
  return pool.query(
    `INSERT INTO fantasy_teams (team_name, user_id)
     VALUES ($1, $2)
     RETURNING team_id, team_name, user_id;`,
    [teamName, userId],
  );
};

export const findPlayerInTeam = (teamId: number, playerId: number) => {
  return pool.query(
    "SELECT 1 FROM fantasy_team_players WHERE team_id = $1 AND player_id = $2",
    [teamId, playerId],
  );
};

export const insertPlayerToTeam = (teamId: number, playerId: number) => {
  return pool.query(
    `INSERT INTO fantasy_team_players (team_id, player_id)
     VALUES ($1, $2)
     RETURNING *;`,
    [teamId, playerId],
  );
};

export const removePlayerFromTeam = (teamId: number, playerId: number) => {
  return pool.query(
    `DELETE FROM fantasy_team_players 
       WHERE team_id = $1 AND player_id = $2
       RETURNING player_id;`,
    [teamId, playerId],
  );
};

export const getTeamPlayers = (teamId: number) => {
  return pool.query(
    `
    WITH active_roster AS (
      SELECT player_id, is_captain
      FROM fantasy_team_players
      WHERE team_id = $1 AND COALESCE(is_active, true)
    ),

    last_gameday AS (
      SELECT
        date_trunc('day', NOW() - INTERVAL '6 hours') + INTERVAL '6 hours' AS end_time,
        date_trunc('day', NOW() - INTERVAL '6 hours') + INTERVAL '6 hours' - INTERVAL '1 day' AS start_time
    ),

    filtered_stats AS (
      SELECT 
        pgs.player_id,
        pgs.points_earned
      FROM player_game_stats pgs
      JOIN matches m ON m.match_id = pgs.match_id
      CROSS JOIN last_gameday
      WHERE m.scheduled_at >= last_gameday.start_time
        AND m.scheduled_at < last_gameday.end_time
    )

    SELECT 
      p.player_id,
      (p.first_name || ' ' || p.last_name) AS name,
      p.position AS pos,
      p.team_abbrev AS team,
      p.current_price AS salary,
      rt.primary_color AS color,
      COALESCE(r.is_captain, false) AS is_captain,
      COALESCE(SUM(fs.points_earned), 0) AS points
    FROM active_roster r
    JOIN players p ON p.player_id = r.player_id
    JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
    LEFT JOIN filtered_stats fs ON fs.player_id = p.player_id

    GROUP BY
      p.player_id, p.first_name, p.last_name, p.position,
      p.team_abbrev, p.current_price, rt.primary_color,
      r.is_captain

    ORDER BY name;
    `,
    [teamId],
  );
};

export const teamExists = (teamId: number) => {
  return pool.query("SELECT 1 FROM fantasy_teams WHERE team_id = $1", [teamId]);
};

export const getTeamsByOwner = (userId: number) => {
  return pool.query(
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
    [userId],
  );
};

export const insertOrReactivatePlayers = async (
  client: any,
  teamId: number,
  playerIds: number[],
) => {
  if (playerIds.length === 0) return;

  for (const pid of playerIds) {
    await client.query(
      `INSERT INTO fantasy_team_players (team_id, player_id, is_captain, added_at, is_active)
       VALUES ($1, $2, false, NOW(), true)
       ON CONFLICT (team_id, player_id) DO UPDATE SET is_active = true`,
      [teamId, pid],
    );
  }
};

export const markRemovedPlayers = async (
  client: any,
  teamId: number,
  playerIds: number[],
) => {
  if (playerIds.length === 0) {
    await client.query(`DELETE FROM fantasy_team_players WHERE team_id = $1`, [teamId]);
    return;
  }
  await client.query(
    `DELETE FROM fantasy_team_players WHERE team_id = $1 AND player_id <> ALL($2::int[])`,
    [teamId, playerIds],
  );
};

export const setTeamCaptain = async (
  client: any,
  teamId: number,
  playerId: number,
) => {
  const onTeam = await client.query(
    `SELECT 1 FROM fantasy_team_players
     WHERE team_id = $1 AND player_id = $2 AND COALESCE(is_active, true)`,
    [teamId, playerId],
  );
  if (!onTeam.rows?.length) {
    throw new ServiceError("Player is not on this team", 400);
  }
  await client.query(`UPDATE fantasy_team_players SET is_captain = false WHERE team_id = $1`, [
    teamId,
  ]);
  await client.query(
    `UPDATE fantasy_team_players SET is_captain = true WHERE team_id = $1 AND player_id = $2`,
    [teamId, playerId],
  );
};

/** Current captain only (fantasy_team_players). No captain_history writes — that happens on trade lock. */
export const setTeamCaptainStandalone = async (teamId: number, playerId: number) => {
  await pool.query("BEGIN");
  try {
    const onTeam = await pool.query(
      `SELECT 1 FROM fantasy_team_players
       WHERE team_id = $1 AND player_id = $2 AND COALESCE(is_active, true)`,
      [teamId, playerId],
    );
    if (!onTeam.rows?.length) {
      throw new ServiceError("Player is not on this team", 400);
    }
    await pool.query(`UPDATE fantasy_team_players SET is_captain = false WHERE team_id = $1`, [
      teamId,
    ]);
    await pool.query(
      `UPDATE fantasy_team_players SET is_captain = true WHERE team_id = $1 AND player_id = $2`,
      [teamId, playerId],
    );
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }
};

/** Teams with at least one active player but not exactly one captain (cannot lock trading). */
export const getTeamIdsWithInvalidCaptainCount = (client: any) => {
  return client.query(
    `
    SELECT team_id
    FROM fantasy_team_players
    WHERE COALESCE(is_active, true)
    GROUP BY team_id
    HAVING COUNT(*) > 0 AND SUM(CASE WHEN is_captain THEN 1 ELSE 0 END) != 1
    `,
  );
};

export const wouldRemoveCaptainWithOthersRemaining = async (
  teamId: number,
  playerId: number,
) => {
  const r = await pool.query(
    `
    SELECT
      COUNT(*)::int AS cnt,
      BOOL_OR(player_id = $2 AND is_captain) AS removing_captain
    FROM fantasy_team_players
    WHERE team_id = $1 AND COALESCE(is_active, true)
    `,
    [teamId, playerId],
  );
  const row = r.rows[0];
  return Number(row.cnt) > 1 && Boolean(row.removing_captain);
};

/** Close open segments and snapshot current fantasy_team_players captain per team (call inside lock transaction). */
export const syncCaptainHistoryFromLock = async (client: any, asOf: string) => {
  await client.query(
    `UPDATE captain_history SET to_date = $1::timestamptz WHERE to_date IS NULL`,
    [asOf],
  );
  await client.query(
    `
    INSERT INTO captain_history (team_id, player_id, from_date, to_date)
    SELECT ftp.team_id, ftp.player_id, $1::timestamptz, NULL
    FROM fantasy_team_players ftp
    WHERE COALESCE(ftp.is_active, true) AND ftp.is_captain = true
    `,
    [asOf],
  );
};

/** Returns the player_id who was captain for this team on the given date, or null. */
export const getCaptainForDate = async (
  teamId: number,
  gameDate: string,
): Promise<number | null> => {
  const result = await pool.query(
    `
    SELECT COALESCE(
      (
        SELECT player_id
        FROM captain_history
        WHERE team_id = $1
          AND from_date::date <= $2::date
          AND (to_date IS NULL OR to_date::date >= $2::date)
        ORDER BY from_date DESC
        LIMIT 1
      ),
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM captain_history WHERE team_id = $1)
        THEN (
          SELECT player_id
          FROM fantasy_team_players
          WHERE team_id = $1 AND COALESCE(is_active, true) AND is_captain
          LIMIT 1
        )
        ELSE NULL
      END
    ) AS player_id
    `,
    [teamId, gameDate],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].player_id as number;
};

export const getTeamBudgetSpent = async (client: any, teamId: number) => {
  const result = await client.query(
    `
    SELECT COALESCE(SUM(p.current_price),0) AS total_spent
    FROM fantasy_team_players ftp
    JOIN players p ON p.player_id = ftp.player_id
    WHERE ftp.team_id = $1
      AND COALESCE(ftp.is_active, true)
    `,
    [teamId],
  );

  return Number(result.rows[0].total_spent);
};

export const getTeamBudgetRemaining = async (teamId: number) => {
  const result = await pool.query(
    `SELECT budget_remaining FROM fantasy_teams WHERE team_id = $1`,
    [teamId],
  );
  return result.rows[0]?.budget_remaining ?? 0;
};

export const getRankedLineup = async (order: "DESC" | "ASC") => {
  const sql = `
    WITH last_match_info AS (
      SELECT 
        MAX((scheduled_at AT TIME ZONE 'Europe/Helsinki')::date) AS last_gameday
      FROM matches
      WHERE is_processed = true
    ),
    target_window AS (
      SELECT 
        (last_gameday + time '12:00:00' - interval '1 day') as window_start,
        (last_gameday + time '12:00:00') as window_end
      FROM last_match_info
    ),
    best_game_per_player AS (
      SELECT DISTINCT ON (pgs.player_id)
        p.player_id,
        (p.first_name || ' ' || p.last_name) AS name,
        p.position AS pos,
        p.team_abbrev AS abbrev,
        rt.primary_color AS color,
        pgs.points_earned AS points,
        pgs.goals, pgs.assists, pgs.sog, pgs.hits,
        pgs.blocked_shots, pgs.pim, pgs.saves,
        m.scheduled_at, pgs.is_win,
        CASE 
          WHEN p.team_abbrev = m.home_team_abbrev THEN m.away_score 
          ELSE m.home_score 
        END as goals_against
      FROM players p
      JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
      JOIN player_game_stats pgs ON p.player_id = pgs.player_id
      JOIN matches m ON pgs.match_id = m.match_id
      CROSS JOIN target_window
      WHERE m.scheduled_at >= target_window.window_start
        AND m.scheduled_at < target_window.window_end
        AND m.is_processed = true
      ORDER BY pgs.player_id, pgs.points_earned ${order}
    ),
    ranked_players AS (
      SELECT *,
        ROW_NUMBER() OVER(PARTITION BY pos ORDER BY points ${order}) as rank
      FROM best_game_per_player
    )
    SELECT * FROM ranked_players
    WHERE (pos = 'F' AND rank <= 3)
       OR (pos = 'D' AND rank <= 2)
       OR (pos = 'G' AND rank <= 1)
    ORDER BY pos DESC, points ${order};
  `;

  const result = await pool.query(sql);
  return result.rows;
};

export const getDailyTeamPerformance = (team_id: number, period_id: number) => {
  return pool.query(
    `
    WITH days AS (
      SELECT generate_series(
        start_date,
        LEAST(end_date, CURRENT_DATE),
        '1 day'
      )::date AS game_date
      FROM scoring_periods
      WHERE period_id = $2
    ),

    captain_on_day AS (
      SELECT
        d.game_date,
        COALESCE(
          (
            SELECT ch.player_id
            FROM captain_history ch
            WHERE ch.team_id = $1
              AND ch.from_date::date <= d.game_date
              AND (ch.to_date IS NULL OR ch.to_date::date >= d.game_date)
            ORDER BY ch.from_date DESC
            LIMIT 1
          ),
          CASE
            WHEN NOT EXISTS (SELECT 1 FROM captain_history WHERE team_id = $1)
            THEN (
              SELECT player_id
              FROM fantasy_team_players
              WHERE team_id = $1 AND COALESCE(is_active, true) AND is_captain
              LIMIT 1
            )
            ELSE NULL
          END
        ) AS captain_player_id
      FROM days d
    ),

    active_players AS (
      SELECT
        d.game_date,
        r.player_id
      FROM days d
      JOIN fantasy_team_roster r
        ON r.team_id = $1
        AND r.added_at::date <= d.game_date
        AND (r.removed_at IS NULL OR r.removed_at::date > d.game_date)
    ),

    player_daily_points AS (
      SELECT
        ap.game_date,
        ap.player_id,
        COALESCE(SUM(pgs.points_earned), 0) AS points
      FROM active_players ap
      LEFT JOIN matches m
        ON (m.scheduled_at - INTERVAL '6 hours')::date = ap.game_date
        AND m.is_processed = true
      LEFT JOIN player_game_stats pgs
        ON pgs.match_id = m.match_id
        AND pgs.player_id = ap.player_id
      GROUP BY ap.game_date, ap.player_id
    )

    SELECT
      pdp.game_date,
      SUM(
        CASE
          WHEN pdp.player_id = cod.captain_player_id
          THEN pdp.points * COALESCE(
            (SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'),
            100
          )::numeric / 100
          ELSE pdp.points
        END
      ) AS points,
      COUNT(*) AS active_players_count
    FROM player_daily_points pdp
    LEFT JOIN captain_on_day cod ON cod.game_date = pdp.game_date
    GROUP BY pdp.game_date
    ORDER BY pdp.game_date;
    `,
    [team_id, period_id],
  );
};

export const deleteTeam = (teamId: number) => {
  return pool.query(
    "DELETE FROM fantasy_teams WHERE team_id = $1 RETURNING team_id",
    [teamId],
  );
};

function getDailyPlayerBreakdownSql(useCaptainHistory: boolean): string {
  const captainCase = useCaptainHistory
    ? `CASE
          WHEN p.player_id = (SELECT captain_player_id FROM captain_on_date)
          THEN (pgs.points_earned *
                COALESCE(
                  (SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'),
                  100
                ) / 100)
          ELSE pgs.points_earned
        END`
    : `pgs.points_earned`;

  const captainCte = useCaptainHistory
    ? `,
    captain_on_date AS (
      SELECT COALESCE(
        (
          SELECT player_id
          FROM captain_history
          WHERE team_id = $1
            AND from_date::date <= $2::date
            AND (to_date IS NULL OR to_date::date >= $2::date)
          ORDER BY from_date DESC
          LIMIT 1
        ),
        CASE
          WHEN NOT EXISTS (SELECT 1 FROM captain_history WHERE team_id = $1)
          THEN (
            SELECT player_id
            FROM fantasy_team_players
            WHERE team_id = $1 AND COALESCE(is_active, true) AND is_captain
            LIMIT 1
          )
          ELSE NULL
        END
      ) AS captain_player_id
    )`
    : "";

  return `
    WITH roster_on_day AS (
      SELECT DISTINCT r.player_id
      FROM fantasy_team_roster r
      WHERE r.team_id = $1
        AND r.added_at::date <= $2::date
        AND (r.removed_at IS NULL OR r.removed_at::date > $2::date)
    ),
    day_matches AS (
      SELECT m.match_id
      FROM matches m
      WHERE (m.scheduled_at - INTERVAL '6 hours')::date = $2::date
        AND m.is_processed = true
    )${captainCte}
    SELECT
      p.player_id,
      (p.first_name || ' ' || p.last_name) AS player_name,
      COALESCE(SUM(${captainCase}),0) AS points
    FROM roster_on_day r
    JOIN players p ON p.player_id = r.player_id
    LEFT JOIN player_game_stats pgs
      ON pgs.player_id = r.player_id
      AND pgs.match_id IN (SELECT match_id FROM day_matches)
    GROUP BY p.player_id, p.first_name, p.last_name
    ORDER BY points DESC;
  `;
}

export const getDailyPlayerBreakdown = async (
  team_id: number,
  game_date: string,
) => {
  try {
    const result = await pool.query(getDailyPlayerBreakdownSql(true), [
      team_id,
      game_date,
    ]);
    return result;
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code
        : "";
    if (
      code === "42P01" ||
      (typeof (err as Error)?.message === "string" &&
        (err as Error).message.includes("captain_history"))
    ) {
      return pool.query(getDailyPlayerBreakdownSql(false), [
        team_id,
        game_date,
      ]);
    }
    throw err;
  }
};

export const getTeamLastNightPoints = (teamId: number) => {
  return pool.query(
    `
    WITH last_gameday AS (
      SELECT
        date_trunc('day', MAX(scheduled_at) - INTERVAL '6 hours') + INTERVAL '6 hours' AS end_time,
        date_trunc('day', MAX(scheduled_at) - INTERVAL '6 hours') + INTERVAL '6 hours' - INTERVAL '1 day' AS start_time,
        date_trunc('day', MAX(scheduled_at) - INTERVAL '6 hours')::date AS game_day_date
      FROM matches
      WHERE is_processed = true
    ),
    captain_last_night AS (
      SELECT COALESCE(
        (
          SELECT ch.player_id
          FROM captain_history ch
          CROSS JOIN last_gameday lg
          WHERE ch.team_id = $1
            AND ch.from_date::date <= lg.game_day_date
            AND (ch.to_date IS NULL OR ch.to_date::date >= lg.game_day_date)
          ORDER BY ch.from_date DESC
          LIMIT 1
        ),
        CASE
          WHEN NOT EXISTS (SELECT 1 FROM captain_history WHERE team_id = $1)
          THEN (
            SELECT player_id
            FROM fantasy_team_players
            WHERE team_id = $1 AND COALESCE(is_active, true) AND is_captain
            LIMIT 1
          )
          ELSE NULL
        END
      ) AS captain_player_id
      FROM last_gameday
    )
    SELECT COALESCE(SUM(
      CASE
        WHEN r.player_id = (SELECT captain_player_id FROM captain_last_night)
        THEN (pgs.points_earned *
              COALESCE(
                (SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'),
                100
              ) / 100)
        ELSE pgs.points_earned
      END
    ), 0) AS last_night_points
    FROM fantasy_team_roster r
    JOIN player_game_stats pgs ON pgs.player_id = r.player_id
    JOIN matches m ON pgs.match_id = m.match_id
    WHERE r.team_id = $1
      AND r.removed_at IS NULL
      AND m.scheduled_at >= (SELECT start_time FROM last_gameday)
      AND m.scheduled_at < (SELECT end_time FROM last_gameday);
    `,
    [teamId],
  );
};

export const getTradeLockConfig = () => {
  return pool.query(
    `
    SELECT id, is_enabled, lock_window_minutes, manual_lock, manual_unlock_until, last_lock_at
    FROM trade_lock_config
    WHERE id = 1
    LIMIT 1
    `,
  );
};

export const setTradeLockLastLockAt = (lockAt: string) => {
  return pool.query(
    `
    UPDATE trade_lock_config
    SET last_lock_at = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    `,
    [lockAt],
  );
};

export const setTradeLockState = (locked: boolean, lockAt: string | null = null) => {
  return pool.query(
    `
    UPDATE trade_lock_config
    SET
      manual_lock = $1,
      manual_unlock_until = NULL,
      last_lock_at = CASE
        WHEN $1 = true THEN COALESCE($2::timestamptz, NOW())
        ELSE last_lock_at
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    `,
    [locked, lockAt],
  );
};

export const setTradeLockStateWithClient = (
  client: any,
  locked: boolean,
  lockAt: string | null = null,
) => {
  return client.query(
    `
    UPDATE trade_lock_config
    SET
      manual_lock = $1,
      manual_unlock_until = NULL,
      last_lock_at = CASE
        WHEN $1 = true THEN COALESCE($2::timestamptz, NOW())
        ELSE last_lock_at
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    `,
    [locked, lockAt],
  );
};

export const syncRosterHistoryFromCurrentPlayers = async (client: any, asOf: string) => {
  await client.query(
    `
    WITH current_players AS (
      SELECT ftp.team_id, ftp.player_id, COALESCE(ftp.is_captain, false) AS is_captain
      FROM fantasy_team_players ftp
      WHERE COALESCE(ftp.is_active, true)
    ),
    active_history AS (
      SELECT r.team_id, r.player_id
      FROM fantasy_team_roster r
      WHERE r.removed_at IS NULL
    ),
    to_remove AS (
      SELECT ah.team_id, ah.player_id
      FROM active_history ah
      LEFT JOIN current_players cp
        ON cp.team_id = ah.team_id AND cp.player_id = ah.player_id
      WHERE cp.player_id IS NULL
    )
    UPDATE fantasy_team_roster r
    SET removed_at = $1::timestamptz
    WHERE r.removed_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM to_remove tr
        WHERE tr.team_id = r.team_id
          AND tr.player_id = r.player_id
      )
    `,
    [asOf],
  );

  await client.query(
    `
    WITH current_players AS (
      SELECT ftp.team_id, ftp.player_id, COALESCE(ftp.is_captain, false) AS is_captain
      FROM fantasy_team_players ftp
      WHERE COALESCE(ftp.is_active, true)
    ),
    active_history AS (
      SELECT r.team_id, r.player_id
      FROM fantasy_team_roster r
      WHERE r.removed_at IS NULL
    ),
    to_add AS (
      SELECT cp.team_id, cp.player_id, cp.is_captain
      FROM current_players cp
      LEFT JOIN active_history ah
        ON ah.team_id = cp.team_id AND ah.player_id = cp.player_id
      WHERE ah.player_id IS NULL
    )
    INSERT INTO fantasy_team_roster (team_id, player_id, added_at, removed_at, is_captain)
    SELECT ta.team_id, ta.player_id, $1::timestamptz, NULL, ta.is_captain
    FROM to_add ta
    `,
    [asOf],
  );

  await client.query(
    `
    UPDATE fantasy_team_roster r
    SET is_captain = COALESCE(ftp.is_captain, false)
    FROM fantasy_team_players ftp
    WHERE r.team_id = ftp.team_id
      AND r.player_id = ftp.player_id
      AND r.removed_at IS NULL
      AND COALESCE(ftp.is_active, true)
    `,
  );
};

export const getLastProcessedTradeLockSnapshotAt = (lockWindowMinutes: number) => {
  return pool.query(
    `
    WITH last_gameday AS (
      SELECT date_trunc('day', MAX(m.scheduled_at) - INTERVAL '6 hours')::date AS game_day_date
      FROM matches m
      WHERE m.is_processed = true
    ),
    first_match AS (
      SELECT MIN(m.scheduled_at) AS first_match_at
      FROM matches m
      CROSS JOIN last_gameday lg
      WHERE m.is_processed = true
        AND (m.scheduled_at - INTERVAL '6 hours')::date = lg.game_day_date
    )
    SELECT
      CASE
        WHEN first_match_at IS NULL THEN NULL
        ELSE first_match_at - make_interval(mins => $1::int)
      END AS snapshot_at
    FROM first_match
    `,
    [lockWindowMinutes],
  );
};

export const getTeamPlayersAtTimestamp = (teamId: number, asOf: string) => {
  return pool.query(
    `
    WITH roster_at_time AS (
      SELECT DISTINCT ON (player_id) roster_id, player_id, is_captain
      FROM fantasy_team_roster
      WHERE team_id = $1
        AND added_at <= $2::timestamptz
        AND (removed_at IS NULL OR removed_at > $2::timestamptz)
      ORDER BY player_id, roster_id DESC
    ),
    last_gameday AS (
      SELECT
        date_trunc('day', NOW() - INTERVAL '6 hours') + INTERVAL '6 hours' AS end_time,
        date_trunc('day', NOW() - INTERVAL '6 hours') + INTERVAL '6 hours' - INTERVAL '1 day' AS start_time
    ),
    filtered_stats AS (
      SELECT
        pgs.player_id,
        pgs.points_earned
      FROM player_game_stats pgs
      JOIN matches m ON m.match_id = pgs.match_id
      CROSS JOIN last_gameday
      WHERE m.is_processed = true
        AND m.scheduled_at >= last_gameday.start_time
        AND m.scheduled_at < last_gameday.end_time
    )
    SELECT
      p.player_id,
      (p.first_name || ' ' || p.last_name) AS name,
      p.position AS pos,
      p.team_abbrev AS team,
      p.current_price AS salary,
      rt.primary_color AS color,
      COALESCE(r.is_captain, false) AS is_captain,
      COALESCE(SUM(fs.points_earned), 0) AS points
    FROM roster_at_time r
    JOIN players p ON p.player_id = r.player_id
    JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
    LEFT JOIN filtered_stats fs ON fs.player_id = p.player_id
    GROUP BY
      p.player_id, p.first_name, p.last_name, p.position,
      p.team_abbrev, p.current_price, rt.primary_color,
      r.is_captain
    ORDER BY name;
    `,
    [teamId, asOf],
  );
};
