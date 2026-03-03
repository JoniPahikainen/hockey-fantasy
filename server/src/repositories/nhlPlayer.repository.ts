import pool from "../db";

export const findAllPlayersWithStats = async () => {
  const query = `
      SELECT 
        p.player_id AS id,
        p.first_name || ' ' || p.last_name AS name,
        p.position AS pos,
        p.team_abbrev AS team,
        p.current_price AS salary,
        COALESCE(SUM(pgs.points_earned), 0) AS points,
        t.primary_color AS color
      FROM players p
      LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
      LEFT JOIN real_teams t ON p.team_abbrev = t.abbreviation
      GROUP BY p.player_id, p.first_name, p.last_name, p.position, p.team_abbrev, p.current_price, t.primary_color
      ORDER BY points DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const findAllPlayersWithPeriodPoints = async (periodId: number) => {
  const query = `
    SELECT 
      p.player_id AS id,
      p.first_name || ' ' || p.last_name AS name,
      p.position AS pos,
      p.team_abbrev AS team,
      p.current_price AS salary,
      COALESCE(SUM(pgs.points_earned), 0) AS points,
      rt.primary_color AS color
    FROM players p
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    LEFT JOIN scoring_periods sp ON sp.period_id = $1
    LEFT JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
    WHERE m.scheduled_at::date BETWEEN sp.start_date AND sp.end_date
    GROUP BY 
      p.player_id, p.first_name, p.last_name, 
      p.position, p.team_abbrev, 
      p.current_price, rt.primary_color
    ORDER BY points DESC;
  `;
  const result = await pool.query(query, [periodId]);
  return result.rows;
};