import pool from "../db";

export const insertLeague = (
  name: string,
  passcode: string,
  creator_id: number,
) => {
  return pool.query(
    `INSERT INTO leagues (name, passcode, creator_id) VALUES ($1, $2, $3) RETURNING *;`,
    [name, passcode, creator_id],
  );
};

export const getPasscode = (league_id: number) => {
  return pool.query("SELECT passcode FROM leagues WHERE league_id = $1", [
    league_id,
  ]);
};

export const getLeagueCreator = (league_id: number) => {
  return pool.query("SELECT creator_id FROM leagues WHERE league_id = $1", [
    league_id,
  ]);
};

export const getTeamUserId = (team_id: number) => {
  return pool.query("SELECT user_id FROM fantasy_teams WHERE team_id = $1", [
    team_id,
  ]);
};

export const addMember = (league_id: number, team_id: number) => {
  return pool.query(
    "INSERT INTO league_members (league_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [league_id, team_id],
  );
};

export const removeMember = (league_id: number, team_id: number) => {
  return pool.query(
    "DELETE FROM league_members WHERE league_id = $1 AND team_id = $2",
    [league_id, team_id],
  );
};

export const deleteLeague = (league_id: number) => {
  return pool.query("DELETE FROM leagues WHERE league_id = $1", [league_id]);
};

export const getFullStandings = (league_id: number) => {
  return pool.query(
    `
    SELECT 
      t.team_id,
      t.team_name,
      u.username AS owner_name,
      ROUND(COALESCE(SUM(dtp.points_earned), 0), 2) AS total_points,
      RANK() OVER (ORDER BY COALESCE(SUM(dtp.points_earned), 0) DESC) AS rank
    FROM league_members lm
    JOIN fantasy_teams t ON lm.team_id = t.team_id
    JOIN users u ON t.user_id = u.user_id
    LEFT JOIN daily_team_points dtp ON dtp.team_id = t.team_id AND dtp.day >= t.created_at::date
    WHERE lm.league_id = $1
    GROUP BY t.team_id, t.team_name, u.username
    ORDER BY total_points DESC;
    `,
    [league_id],
  );
};

export const getLeagueStandingsByPeriod = (
  league_id: number,
  period_id: number,
) => {
  return pool.query(
    `
    WITH sp AS (
      SELECT period_id, start_date, end_date
      FROM scoring_periods
      WHERE period_id = $2
      LIMIT 1
    ),
    last_fantasy_day AS (
      SELECT (date_trunc('day', NOW() - INTERVAL '6 hours') - INTERVAL '1 day')::date AS day
    ),
    period_totals AS (
      SELECT
        t.team_id,
        t.team_name,
        u.username AS owner_name,
        ROUND(COALESCE(SUM(dtp.points_earned), 0), 2) AS period_points
      FROM league_members lm
      JOIN fantasy_teams t ON lm.team_id = t.team_id
      JOIN users u ON t.user_id = u.user_id
      CROSS JOIN sp
      LEFT JOIN daily_team_points dtp
        ON dtp.team_id = t.team_id
        AND dtp.day BETWEEN sp.start_date AND sp.end_date
        AND dtp.day >= t.created_at::date
      WHERE lm.league_id = $1
      GROUP BY t.team_id, t.team_name, u.username
    ),
    last_night AS (
      SELECT
        dtp.team_id,
        ROUND(COALESCE(SUM(dtp.points_earned), 0), 2) AS last_night_points
      FROM daily_team_points dtp
      JOIN league_members lm ON lm.team_id = dtp.team_id AND lm.league_id = $1
      CROSS JOIN last_fantasy_day lg
      WHERE dtp.day = lg.day
      GROUP BY dtp.team_id
    )
    SELECT
      pt.team_id,
      pt.team_name,
      pt.owner_name,
      pt.period_points,
      COALESCE(ln.last_night_points, 0) AS last_night_points,
      RANK() OVER (ORDER BY pt.period_points DESC) AS rank
    FROM period_totals pt
    LEFT JOIN last_night ln ON ln.team_id = pt.team_id
    ORDER BY pt.period_points DESC;
    `,
    [league_id, period_id],
  );
};

export const getLeaguesByUserId = (user_id: number) => {
  return pool.query(
    `
      SELECT 
        l.league_id, 
        l.name, 
        l.creator_id,
        lm.team_id,
        ft.team_name
      FROM leagues l
      JOIN league_members lm ON l.league_id = lm.league_id
      JOIN fantasy_teams ft ON lm.team_id = ft.team_id
      WHERE ft.user_id = $1;
      `,
    [user_id],
  );
};

export const getCurrentPeriod = () => {
  return pool.query(
    `SELECT period_id, start_date, end_date
        FROM scoring_periods
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1;`,
  );
};

export const getScoringPeriods = () => {
  return pool.query(
    `
    SELECT
      period_id,
      period_name,
      start_date,
      end_date,
      CASE
        WHEN CURRENT_DATE < start_date THEN 'locked'
        WHEN CURRENT_DATE > end_date THEN 'past'
        ELSE 'current'
      END AS status
    FROM scoring_periods
    ORDER BY start_date ASC;
    `,
  );
};

export const getLeagueRecords = (league_id: number, period_id: number | null) => {
  return pool.query(
    `
    WITH captain_multiplier AS (
      SELECT COALESCE(
        (SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'),
        100
      )::numeric / 100 AS mult
    ),

    team_base AS (
      SELECT t.team_id, t.team_name
      FROM league_members lm
      JOIN fantasy_teams t ON t.team_id = lm.team_id
      WHERE lm.league_id = $1
    ),

    period_window AS (
      SELECT start_date, end_date
      FROM scoring_periods
      WHERE period_id = $2
    ),

    player_events AS (
      SELECT
        tb.team_id,
        tb.team_name,
        date_trunc('day', m.scheduled_at - INTERVAL '6 hours') + INTERVAL '6 hours' AS fantasy_day_start,
        date_trunc('day', m.scheduled_at - INTERVAL '6 hours')::date AS fantasy_day_date,
        pgs.goals,
        pgs.assists,
        pgs.pim,
        pgs.points_earned,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM captain_history ch
            WHERE ch.team_id = tb.team_id
              AND ch.player_id = pgs.player_id
              AND ch.from_date::date <= date_trunc('day', m.scheduled_at - INTERVAL '6 hours')::date
              AND (ch.to_date IS NULL OR ch.to_date::date >= date_trunc('day', m.scheduled_at - INTERVAL '6 hours')::date)
          )
          THEN (SELECT mult FROM captain_multiplier)
          WHEN NOT EXISTS (
            SELECT 1
            FROM captain_history ch
            WHERE ch.team_id = tb.team_id
              AND ch.from_date::date <= date_trunc('day', m.scheduled_at - INTERVAL '6 hours')::date
              AND (ch.to_date IS NULL OR ch.to_date::date >= date_trunc('day', m.scheduled_at - INTERVAL '6 hours')::date)
          )
               AND EXISTS (
            SELECT 1
            FROM fantasy_team_players ftp
            WHERE ftp.team_id = tb.team_id
              AND ftp.player_id = pgs.player_id
              AND ftp.is_captain
              AND COALESCE(ftp.is_active, true)
          )
          THEN (SELECT mult FROM captain_multiplier)
          ELSE 1
        END AS captain_mult
      FROM team_base tb
      JOIN fantasy_team_roster r ON r.team_id = tb.team_id
      JOIN player_game_stats pgs ON pgs.player_id = r.player_id
      JOIN matches m ON m.match_id = pgs.match_id
      WHERE m.is_processed = true
        AND r.added_at <= m.scheduled_at
        AND (r.removed_at IS NULL OR r.removed_at > m.scheduled_at)
    ),

    team_day_stats AS (
      SELECT
        team_id,
        team_name,
        fantasy_day_start,
        fantasy_day_date,
        SUM(goals) AS goals,
        SUM(goals + assists) AS points,
        SUM(pim) AS penalties,
        ROUND(SUM(points_earned * captain_mult), 0) AS fantasy_points
      FROM player_events
      GROUP BY team_id, team_name, fantasy_day_start, fantasy_day_date
    ),

    last_day AS (
      SELECT MAX(fantasy_day_start) AS day_start
      FROM team_day_stats
    ),

    scoped_data AS (
      SELECT 'last_night' AS scope, tds.*
      FROM team_day_stats tds
      JOIN last_day ld ON tds.fantasy_day_start = ld.day_start

      UNION ALL

      SELECT 'season' AS scope, tds.*
      FROM team_day_stats tds

      UNION ALL

      SELECT 'period' AS scope, tds.*
      FROM team_day_stats tds
      JOIN period_window pw 
        ON tds.fantasy_day_date BETWEEN pw.start_date AND pw.end_date
    ),

    unpivoted AS (
      SELECT scope, team_name, 'goals' AS metric, goals::numeric AS value FROM scoped_data
      UNION ALL
      SELECT scope, team_name, 'points', points::numeric FROM scoped_data
      UNION ALL
      SELECT scope, team_name, 'penalties', penalties::numeric FROM scoped_data
      UNION ALL
      SELECT scope, team_name, 'fantasy_points', fantasy_points FROM scoped_data
    ),

    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY scope, metric
          ORDER BY value DESC, team_name ASC
        ) AS rn
      FROM unpivoted
    )

    SELECT scope, metric, team_name, value
    FROM ranked
    WHERE rn = 1
    ORDER BY scope, metric;
    `,
    [league_id, period_id],
  );
};