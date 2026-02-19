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
  return pool.query(
    "DELETE FROM leagues WHERE league_id = $1",
    [league_id],
  );
};

export const getFullStandings = (league_id: number) => {
  return pool.query(
    `
    SELECT t.team_id, t.team_name, u.username as owner_name, 
      ROUND(COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0), 2) as total_points,
      RANK() OVER (ORDER BY COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) DESC) as rank
    FROM league_members lm
    JOIN fantasy_teams t ON lm.team_id = t.team_id
    JOIN users u ON t.user_id = u.user_id
    LEFT JOIN roster_history rh ON rh.team_id = t.team_id
    LEFT JOIN matches m ON m.scheduled_at::date = rh.game_date 
    LEFT JOIN player_game_stats pgs ON (pgs.player_id = rh.player_id AND pgs.match_id = m.match_id)
    WHERE lm.league_id = $1
    GROUP BY t.team_id, t.team_name, u.username
    ORDER BY total_points DESC;`,
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
        ROUND(COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0), 2) AS period_points,
        RANK() OVER (ORDER BY COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) DESC) AS rank
      FROM league_members lm
      JOIN fantasy_teams t ON lm.team_id = t.team_id
      JOIN users u ON t.user_id = u.user_id
      JOIN scoring_periods sp ON sp.period_id = $2      
      LEFT JOIN roster_history rh ON rh.team_id = t.team_id 
        AND rh.game_date BETWEEN sp.start_date AND sp.end_date      
      LEFT JOIN matches m ON m.scheduled_at::date = rh.game_date
      LEFT JOIN player_game_stats pgs ON (pgs.player_id = rh.player_id AND pgs.match_id = m.match_id)
      WHERE lm.league_id = $1 
      GROUP BY t.team_id, t.team_name, u.username
      ORDER BY period_points DESC
      `,
    [league_id, period_id],
  );
};

export const getCurrentPeriodStandings = (league_id: number) => {
  return pool.query(
    `
      SELECT 
        t.team_id,
        t.team_name,
        u.username AS owner_name,
        ROUND(COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0), 2) AS period_points,
        RANK() OVER (ORDER BY COALESCE(SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END), 0) DESC) AS rank
      FROM league_members lm
      JOIN fantasy_teams t ON lm.team_id = t.team_id
      JOIN users u ON t.user_id = u.user_id
      JOIN scoring_periods sp ON CURRENT_DATE BETWEEN sp.start_date AND sp.end_date
      LEFT JOIN roster_history rh ON rh.team_id = t.team_id 
        AND rh.game_date BETWEEN sp.start_date AND sp.end_date
      LEFT JOIN matches m ON m.scheduled_at::date = rh.game_date
      LEFT JOIN player_game_stats pgs ON (pgs.player_id = rh.player_id AND pgs.match_id = m.match_id)
      WHERE lm.league_id = $1
      GROUP BY t.team_id, t.team_name, u.username
      ORDER BY period_points DESC
      `,
    [league_id],
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
