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
      WITH last_match_info AS (
          SELECT MAX(scheduled_at)::date AS last_gameday
          FROM matches 
          WHERE is_processed = true
      ),
      target_window AS (
          SELECT 
            (last_gameday + time '12:00:00' - interval '1 day') AS window_start,
            (last_gameday + time '12:00:00') AS window_end
          FROM last_match_info
      )
      SELECT 
        p.player_id, 
        (p.first_name || ' ' || p.last_name) AS name, 
        p.position AS pos, 
        p.team_abbrev AS team,
        p.current_price AS salary,
        rt.primary_color AS color,
        COALESCE(
          SUM(
            CASE 
              WHEN m.scheduled_at >= target_window.window_start 
               AND m.scheduled_at < target_window.window_end 
               AND r.roster_id IS NOT NULL
              THEN pgs.points_earned 
              ELSE 0
            END
          ), 0
        ) AS points
      FROM players p
      JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
      JOIN fantasy_team_players ftp ON p.player_id = ftp.player_id
      LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
      LEFT JOIN matches m ON pgs.match_id = m.match_id
      LEFT JOIN fantasy_team_roster r
        ON r.team_id = $1
        AND r.player_id = p.player_id
        AND r.added_at <= m.scheduled_at
        AND (r.removed_at IS NULL OR r.removed_at > m.scheduled_at)
      CROSS JOIN target_window
      WHERE ftp.team_id = $1
      GROUP BY 
        p.player_id, p.first_name, p.last_name, p.position, 
        p.team_abbrev, p.current_price, rt.primary_color,
        target_window.window_start, target_window.window_end;
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


export const insertOrReactivatePlayers = async (client: any, teamId: number, playerIds: number[]) => {
  if (playerIds.length === 0) return;

  await client.query(
    `
    INSERT INTO fantasy_team_roster (team_id, player_id, added_at)
    VALUES ${playerIds.map((pid) => `(${teamId}, ${pid}, CURRENT_TIMESTAMP)`).join(",")}
    ON CONFLICT (team_id, player_id) DO UPDATE 
      SET removed_at = NULL
    `
  );
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

export const getTeamBudgetSpent = async (client: any, teamId: number) => {
  const result = await client.query(
    "SELECT SUM(current_price) as total_spent FROM fantasy_team_players WHERE team_id = $1",
    [teamId]
  );
  return result.rows[0].total_spent;
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
      )
      SELECT 
        days.game_date,
        COALESCE(SUM(pgs.points_earned * CASE WHEN r.is_captain THEN 1.3 ELSE 1 END), 0) AS points,
        COUNT(DISTINCT pgs.player_id) AS active_players_count
      FROM (
        SELECT generate_series(start_date, end_date, '1 day')::date AS game_date
        FROM current_period
      ) days
      LEFT JOIN fantasy_team_roster r
        ON r.team_id = $1
        AND r.added_at::date <= days.game_date
        AND (r.removed_at IS NULL OR r.removed_at::date > days.game_date)
      LEFT JOIN player_game_stats pgs
        ON pgs.player_id = r.player_id
      LEFT JOIN matches m
        ON m.match_id = pgs.match_id
        AND m.scheduled_at::date = days.game_date
      GROUP BY days.game_date
      ORDER BY days.game_date ASC;
      `,
    [team_id, period_id],
  );
};

export const deleteTeam = (teamId: number) => {
  return pool.query("DELETE FROM fantasy_teams WHERE team_id = $1 RETURNING team_id", [teamId]);
};
