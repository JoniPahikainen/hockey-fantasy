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
    SELECT 
      t.team_id,
      t.team_name,
      u.username AS owner_name,
      ROUND(COALESCE(SUM(dtp.points_earned), 0), 2) AS period_points,
      RANK() OVER (ORDER BY COALESCE(SUM(dtp.points_earned), 0) DESC) AS rank
    FROM league_members lm
    JOIN fantasy_teams t ON lm.team_id = t.team_id
    JOIN users u ON t.user_id = u.user_id
    JOIN scoring_periods sp ON sp.period_id = $2
    LEFT JOIN daily_team_points dtp
      ON dtp.team_id = t.team_id
      AND dtp.day BETWEEN sp.start_date AND sp.end_date
      AND dtp.day >= t.created_at::date
    WHERE lm.league_id = $1
    GROUP BY t.team_id, t.team_name, u.username
    ORDER BY period_points DESC;
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

export const getStandingsWithLastNight = (league_id: number) => {
  return pool.query(
    `
    WITH current_period AS (
      SELECT period_id, start_date, end_date
      FROM scoring_periods
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      LIMIT 1
    ),
    last_gameday AS (
      SELECT (MAX(scheduled_at)::date) AS day
      FROM matches
      WHERE is_processed = true
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
      CROSS JOIN current_period cp
      LEFT JOIN daily_team_points dtp
        ON dtp.team_id = t.team_id
        AND dtp.day BETWEEN cp.start_date AND cp.end_date
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
      CROSS JOIN last_gameday lg
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
    [league_id],
  );
};
