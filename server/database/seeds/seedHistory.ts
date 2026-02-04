import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

export async function seedHistory() {
  const tracker = new Logger("HISTORY_SEED");
  tracker.log("INFO", "Generating roster history for past matches...");

  await pool.query(`
    INSERT INTO roster_history (team_id, player_id, game_date, is_captain)
    SELECT 
      ftp.team_id, 
      ftp.player_id, 
      m.scheduled_at::date, 
      ftp.is_captain
    FROM fantasy_team_players ftp
    JOIN players p ON ftp.player_id = p.player_id
    JOIN matches m ON (p.team_abbrev = m.home_team_abbrev OR p.team_abbrev = m.away_team_abbrev)
    WHERE m.scheduled_at < NOW()
    ON CONFLICT DO NOTHING
  `);

  tracker.finish();
}