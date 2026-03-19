import pool from "../db";

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
      SELECT DISTINCT ON (player_id) roster_id, player_id, is_captain
      FROM fantasy_team_roster
      WHERE team_id = $1 AND removed_at IS NULL
      ORDER BY player_id, roster_id DESC
    ),
    last_gameday AS (
        SELECT MAX(scheduled_at)::date AS game_day
        FROM matches
        WHERE is_processed = true
    )
    SELECT 
      p.player_id,
      (p.first_name || ' ' || p.last_name) AS name,
      p.position AS pos,
      p.team_abbrev AS team,
      p.current_price AS salary,
      rt.primary_color AS color,
      COALESCE(r.is_captain, false) AS is_captain,
      COALESCE(
        SUM(
          CASE
            WHEN m.scheduled_at::date = last_gameday.game_day
            THEN pgs.points_earned
            ELSE 0
          END
        ),0
      ) AS points
    FROM active_roster r
    JOIN players p ON p.player_id = r.player_id
    JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    CROSS JOIN last_gameday
    GROUP BY
      p.player_id, p.first_name, p.last_name, p.position,
      p.team_abbrev, p.current_price, rt.primary_color,
      r.is_captain, last_gameday.game_day
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
  playerIds: number[]
) => {
  if (playerIds.length === 0) return;

  for (const pid of playerIds) {

    const res = await client.query(
      `
      UPDATE fantasy_team_roster SET removed_at = NULL
      WHERE team_id = $1 AND player_id = $2 AND removed_at IS NOT NULL
      RETURNING roster_id
      `,
      [teamId, pid]
    );

    if (res.rowCount === 0) {
      await client.query(
        `INSERT INTO fantasy_team_roster (team_id, player_id, added_at)
         SELECT $1, $2, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM fantasy_team_roster
           WHERE team_id = $1 AND player_id = $2 AND removed_at IS NULL
         )`,
        [teamId, pid]
      );
    }
  }
};

export const markRemovedPlayers = async (client: any, teamId: number, playerIds: number[]) => {
  await client.query(
    `
    UPDATE fantasy_team_roster
    SET removed_at = CURRENT_TIMESTAMP
    WHERE team_id = $1
      AND player_id NOT IN (${playerIds.length > 0 ? playerIds.join(",") : "NULL"})
      AND removed_at IS NULL
    `,
    [teamId]
  );
};

export const setTeamCaptain = async (
  client: any,
  teamId: number,
  playerId: number | null,
) => {
  if (playerId == null) {
    await client.query(
      `UPDATE fantasy_team_roster SET is_captain = false WHERE team_id = $1 AND removed_at IS NULL`,
      [teamId],
    );
    return;
  }
  await client.query(
    `
    UPDATE fantasy_team_roster
    SET is_captain = (player_id = $2)
    WHERE team_id = $1 AND removed_at IS NULL
    `,
    [teamId, playerId],
  );
};

export const setTeamCaptainStandalone = async (
  teamId: number,
  playerId: number | null,
) => {
  await pool.query("BEGIN");
  try {
    if (playerId == null) {
      await pool.query(
        `UPDATE fantasy_team_roster SET is_captain = false WHERE team_id = $1 AND removed_at IS NULL`,
        [teamId],
      );
      await pool.query(
        `UPDATE captain_history SET to_date = CURRENT_DATE WHERE team_id = $1 AND to_date IS NULL`,
        [teamId],
      );
    } else {
      await pool.query(
        `
        UPDATE fantasy_team_roster
        SET is_captain = (player_id = $2)
        WHERE team_id = $1 AND removed_at IS NULL
        `,
        [teamId, playerId],
      );
      await pool.query(
        `UPDATE captain_history SET to_date = CURRENT_DATE WHERE team_id = $1 AND to_date IS NULL`,
        [teamId],
      );
      await pool.query(
        `INSERT INTO captain_history (team_id, player_id, from_date, to_date)
         VALUES ($1, $2, CURRENT_DATE, NULL)`,
        [teamId, playerId],
      );
    }
    await pool.query("COMMIT");
  } catch (e) {
    await pool.query("ROLLBACK");
    throw e;
  }
};

/** Returns the player_id who was captain for this team on the given date, or null. */
export const getCaptainForDate = async (
  teamId: number,
  gameDate: string,
): Promise<number | null> => {
  const result = await pool.query(
    `
    SELECT player_id
    FROM captain_history
    WHERE team_id = $1
      AND from_date <= $2::date
      AND (to_date IS NULL OR to_date >= $2::date)
    ORDER BY from_date DESC
    LIMIT 1
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
    AND ftp.is_active = true
    `,
    [teamId]
  );

  return Number(result.rows[0].total_spent);
};


export const getRankedLineup = async (order: "DESC" | "ASC") => {
  const sql = `
    WITH last_match_info AS (
      SELECT (MAX(scheduled_at)::date) as last_gameday FROM matches WHERE is_processed = true
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
    WITH current_period AS (
      SELECT start_date, end_date
      FROM scoring_periods
      WHERE period_id = $2
      LIMIT 1
    ),
    days AS (
      SELECT generate_series(start_date, LEAST(end_date, CURRENT_DATE), '1 day')::date AS game_date
      FROM current_period
    ),
    captain_on_day AS (
      SELECT DISTINCT ON (d.game_date) d.game_date, ch.player_id AS captain_player_id
      FROM days d
      LEFT JOIN captain_history ch ON ch.team_id = $1
        AND ch.from_date <= d.game_date
        AND (ch.to_date IS NULL OR ch.to_date >= d.game_date)
      ORDER BY d.game_date, ch.from_date DESC NULLS LAST
    )
    SELECT
      d.game_date,
      COALESCE(SUM(
        CASE
          WHEN r.player_id = cod.captain_player_id
          THEN (pgs.points_earned *
                COALESCE(
                  (SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'),
                  100
                ) / 100)
          ELSE pgs.points_earned
        END
      ),0) AS points,
      COUNT(DISTINCT r.player_id) AS active_players_count
    FROM days d
    LEFT JOIN captain_on_day cod ON cod.game_date = d.game_date
    LEFT JOIN fantasy_team_roster r
      ON r.team_id = $1
      AND r.added_at::date <= d.game_date
      AND (r.removed_at IS NULL OR r.removed_at::date > d.game_date)
    LEFT JOIN matches m
      ON (m.scheduled_at - INTERVAL '6 hours')::date = d.game_date
      AND m.is_processed = true
    LEFT JOIN player_game_stats pgs
      ON pgs.match_id = m.match_id
      AND pgs.player_id = r.player_id
    GROUP BY d.game_date
    ORDER BY d.game_date;
    `,
    [team_id, period_id]
  );
};

export const deleteTeam = (teamId: number) => {
  return pool.query("DELETE FROM fantasy_teams WHERE team_id = $1 RETURNING team_id", [teamId]);
};

function getDailyPlayerBreakdownSql(useCaptainHistory: boolean): string {
  const captainCte = useCaptainHistory
    ? `,
    captain_on_date AS (
      SELECT player_id AS captain_player_id
      FROM captain_history
      WHERE team_id = $1
        AND from_date <= $2::date
        AND (to_date IS NULL OR to_date >= $2::date)
      ORDER BY from_date DESC
      LIMIT 1
    )`
    : "";
  const captainExpr = useCaptainHistory
    ? "CASE WHEN p.player_id = (SELECT captain_player_id FROM captain_on_date) THEN COALESCE((SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'), 100)::numeric / 100 ELSE 1 END"
    : "1";
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
    ),
    captain_on_date AS (
      SELECT player_id AS captain_player_id
      FROM captain_history
      WHERE team_id = $1
        AND from_date <= $2::date
        AND (to_date IS NULL OR to_date >= $2::date)
      ORDER BY from_date DESC
      LIMIT 1
    )
    SELECT
      (p.first_name || ' ' || p.last_name) AS player_name,
      COALESCE(SUM(
        CASE
          WHEN p.player_id = (SELECT captain_player_id FROM captain_on_date)
          THEN (pgs.points_earned *
                COALESCE(
                  (SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'),
                  100
                ) / 100)
          ELSE pgs.points_earned
        END
      ),0) AS points
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
    const result = await pool.query(
      getDailyPlayerBreakdownSql(true),
      [team_id, game_date],
    );
    return result;
  } catch (err: unknown) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (code === "42P01" || (typeof (err as Error)?.message === "string" && (err as Error).message.includes("captain_history"))) {
      return pool.query(
        getDailyPlayerBreakdownSql(false),
        [team_id, game_date],
      );
    }
    throw err;
  }
};

export const getTeamLastNightPoints = (teamId: number) => {
  return pool.query(
    `
    WITH last_gameday AS (
      SELECT MAX(scheduled_at)::date AS game_day
      FROM matches
      WHERE is_processed = true
    ),
    captain_last_night AS (
      SELECT ch.player_id AS captain_player_id
      FROM captain_history ch
      CROSS JOIN last_gameday lg
      WHERE ch.team_id = $1
        AND ch.from_date <= lg.game_day
        AND (ch.to_date IS NULL OR ch.to_date >= lg.game_day)
      ORDER BY ch.from_date DESC
      LIMIT 1
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
      AND m.scheduled_at::date = (SELECT game_day FROM last_gameday);
    `,
    [teamId]
  );
};

export const getTradeLockConfig = () => {
  return pool.query(
    `
    SELECT id, is_enabled, lock_window_minutes, manual_lock, manual_unlock_until
    FROM trade_lock_config
    WHERE id = 1
    LIMIT 1
    `,
  );
};

export const getFirstUnprocessedMatchTime = () => {
  return pool.query(
    `
    SELECT MIN(scheduled_at) AS next_match_at
    FROM matches
    WHERE is_processed = false
    `,
  );
};

export const markTradeOpenAfterSeed = () => {
  return pool.query(
    `
    UPDATE trade_lock_config c
    SET
      manual_lock = false,
      manual_unlock_until = (
        SELECT m.scheduled_at - make_interval(mins => c.lock_window_minutes)
        FROM matches m
        WHERE m.is_processed = false
        ORDER BY m.scheduled_at
        LIMIT 1
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE c.id = 1
    `,
  );
};
