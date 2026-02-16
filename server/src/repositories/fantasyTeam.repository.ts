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
    `WITH last_match_info AS (
          -- Find the most recent date that has processed games
          SELECT (MAX(scheduled_at)::date) as last_gameday 
          FROM matches 
          WHERE is_processed = true
       ),
       target_window AS (
          -- Define the window (12:00 PM to 12:00 PM)
          SELECT 
            (last_gameday + time '12:00:00' - interval '1 day') as window_start,
            (last_gameday + time '12:00:00') as window_end
          FROM last_match_info
       )
       SELECT 
         p.player_id, 
         (p.first_name || ' ' || p.last_name) AS name, 
         p.position AS pos, 
         p.team_abbrev AS team,
         p.current_price AS salary,
         rt.primary_color AS color,
         -- Sum only points earned within the last night's window
         COALESCE(
           SUM(CASE 
             WHEN m.scheduled_at >= target_window.window_start 
              AND m.scheduled_at < target_window.window_end 
             THEN pgs.points_earned 
             ELSE 0 
           END), 0
         ) AS points
       FROM players p
       JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
       JOIN fantasy_team_players ftp ON p.player_id = ftp.player_id
       LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
       LEFT JOIN matches m ON pgs.match_id = m.match_id
       CROSS JOIN target_window
       WHERE ftp.team_id = $1
       GROUP BY 
         p.player_id, p.first_name, p.last_name, p.position, 
         p.team_abbrev, p.current_price, rt.primary_color,
         target_window.window_start, target_window.window_end;`,
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

export const deleteTeamPlayers = async (client: any, teamId: number) => {
  await client.query("DELETE FROM fantasy_team_players WHERE team_id = $1", [
    teamId,
  ]);
};

export const insertTeamPlayers = async (
  client: any,
  teamId: number,
  playerIds: number[],
) => {
  const insertValues = playerIds.map((pid) => `(${teamId}, ${pid})`).join(",");
  await client.query(
    `INSERT INTO fantasy_team_players (team_id, player_id) VALUES ${insertValues}`,
  );
};

export const updateTeamBudget = async (
  client: any,
  teamId: number,
  playerIds: number[],
) => {
  const query = `
    UPDATE fantasy_teams 
    SET budget_remaining = 2000000 - (
      SELECT COALESCE(SUM(current_price), 0) 
      FROM players 
      WHERE player_id = ANY($1)
    )
    WHERE team_id = $2
    RETURNING budget_remaining`;

  const result = await client.query(query, [playerIds, teamId]);
  return result.rows[0].budget_remaining;
};

export const getTeamAndPlayersRaw = async (userId: number) => {
  const query = `
    WITH last_match_info AS (
        SELECT (MAX(scheduled_at)::date) as last_gameday 
        FROM matches 
        WHERE is_processed = true
    ),
    target_window AS (
        SELECT 
          (last_gameday + time '12:00:00' - interval '1 day') as window_start,
          (last_gameday + time '12:00:00') as window_end
        FROM last_match_info
    )
    SELECT 
      ft.team_id, ft.team_name, ft.budget_remaining, 
      ft.total_points AS team_total_points, p.player_id, 
      (p.first_name || ' ' || p.last_name) AS name, 
      p.position AS pos, p.team_abbrev AS team,
      rt.abbreviation AS abbrev, rt.primary_color AS color,
      p.current_price AS salary,
      COALESCE(
        SUM(CASE 
          WHEN m.scheduled_at >= target_window.window_start 
            AND m.scheduled_at < target_window.window_end 
          THEN pgs.points_earned 
          ELSE 0 
        END), 0
      ) AS points
    FROM fantasy_teams ft
    LEFT JOIN fantasy_team_players ftp ON ft.team_id = ftp.team_id
    LEFT JOIN players p ON ftp.player_id = p.player_id
    LEFT JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    CROSS JOIN target_window
    WHERE ft.user_id = $1
    GROUP BY ft.team_id, p.player_id, rt.abbreviation, rt.primary_color, 
             target_window.window_start, target_window.window_end, ft.created_at
    ORDER BY ft.created_at DESC`;

  return await pool.query(query, [userId]);
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
        COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) as points,
        COUNT(DISTINCT pgs.player_id) as active_players_count
      FROM (
        SELECT generate_series(start_date, end_date, '1 day')::date as game_date
        FROM current_period
      ) days
      LEFT JOIN roster_history rh ON rh.game_date = days.game_date AND rh.team_id = $1
      LEFT JOIN matches m ON m.scheduled_at::date = rh.game_date
      LEFT JOIN player_game_stats pgs ON (pgs.player_id = rh.player_id AND pgs.match_id = m.match_id)
      GROUP BY days.game_date
      ORDER BY days.game_date ASC;
      `,
    [team_id, period_id],
  );
};

export const deleteTeam = (teamId: number) => {
  return pool.query("DELETE FROM fantasy_teams WHERE team_id = $1 RETURNING team_id", [teamId]);
};
