import pool from "../db";

export const findMatchesInTimeRange = async (start: string, end: string) => {
  const query = `
    SELECT 
      match_id, 
      home_team_abbrev, 
      away_team_abbrev, 
      TO_CHAR(scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE 'EET', 'HH24:MI') AS time,
      TO_CHAR(scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE 'EET', 'DD.MM') AS date,
      is_processed
    FROM matches
    WHERE scheduled_at >= $1::timestamp
      AND scheduled_at <= $2::timestamp
    ORDER BY scheduled_at ASC;
  `;
  const result = await pool.query(query, [start, end]);
  return result.rows;
};