import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

export async function seedDailyPoints() {
  const tracker = new Logger("DAILY_POINTS");
  const client = await pool.connect();

  try {
    tracker.log("INFO", "Upserting daily_player_points from player_game_stats...");
    await client.query(`
      INSERT INTO daily_player_points (day, player_id, total_points_earned)
      SELECT
        (m.scheduled_at - INTERVAL '6 hours')::date AS day,
        pgs.player_id,
        ROUND(SUM(pgs.points_earned)::numeric, 2) AS total_points_earned
      FROM player_game_stats pgs
      JOIN matches m ON pgs.match_id = m.match_id
      WHERE m.is_processed = true
      GROUP BY
        (m.scheduled_at - INTERVAL '6 hours')::date,
        pgs.player_id
      ON CONFLICT (day, player_id) DO UPDATE
      SET total_points_earned = EXCLUDED.total_points_earned;
    `);

    tracker.log("INFO", "Upserting daily_team_points from roster history (captain per day from captain_history)...");
    await client.query(`
      INSERT INTO daily_team_points (day, team_id, points_earned)
      SELECT
        ld.day,
        ld.team_id,
        ROUND(SUM(
          dpp.total_points_earned *
          CASE
            WHEN ld.is_captain_on_day THEN COALESCE((SELECT forward FROM scoring_rules WHERE rule_key = 'CAPTAIN_MULTIPLIER'), 100)::numeric / 100
            ELSE 1
          END
        )::numeric,2)
      FROM (
        SELECT DISTINCT ON (d.day, r.team_id, r.player_id)
          d.day,
          r.team_id,
          r.player_id,
          EXISTS (
            SELECT 1 FROM captain_history ch
            WHERE ch.team_id = r.team_id AND ch.player_id = r.player_id
              AND ch.from_date <= d.day
              AND (ch.to_date IS NULL OR ch.to_date >= d.day)
          ) AS is_captain_on_day
        FROM fantasy_team_roster r
        JOIN (
          SELECT DISTINCT (scheduled_at - INTERVAL '6 hours')::date AS day
          FROM matches
          WHERE is_processed = true
        ) d
        ON d.day >= r.added_at::date
        AND (r.removed_at IS NULL OR d.day < r.removed_at::date)
        ORDER BY d.day, r.team_id, r.player_id, r.roster_id DESC
      ) ld
      JOIN daily_player_points dpp
        ON dpp.day = ld.day
        AND dpp.player_id = ld.player_id
      GROUP BY ld.day, ld.team_id
      ON CONFLICT (day, team_id) DO UPDATE
      SET points_earned = EXCLUDED.points_earned;
    `);

    tracker.log("INFO", "Updating fantasy_teams.total_points from daily_team_points...");
    await client.query(`
      UPDATE fantasy_teams ft
      SET total_points = COALESCE(sub.total_earned, 0)
      FROM (
        SELECT dtp.team_id, SUM(dtp.points_earned) AS total_earned
        FROM daily_team_points dtp
        JOIN fantasy_teams t ON t.team_id = dtp.team_id AND dtp.day >= t.created_at::date
        GROUP BY dtp.team_id
      ) sub
      WHERE ft.team_id = sub.team_id
    `);

    tracker.finish();
  } finally {
    client.release();
  }
}
