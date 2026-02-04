import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

export async function seedPoints() {
  const client = await pool.connect();
  const tracker = new Logger("POINTS_CALC");

  try {
    tracker.log("INFO", "Initializing points calculation and batch sync.");

    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM player_game_stats) as stats_count,
        (SELECT COUNT(*) FROM fantasy_teams) as team_count
    `);
    const totalRecords = parseInt(counts.rows[0].stats_count);
    const totalTeams = parseInt(counts.rows[0].team_count);

    const batchTracker = new Logger("POINTS_BATCH", totalRecords);

    tracker.log(
      "INFO",
      "Step 0: Resetting points and calculating Win/Loss status...",
    );
    await client.query(`
      UPDATE player_game_stats pgs
      SET points_earned = 0, 
          is_processed = false,
          is_win = CASE 
            WHEN (p.team_abbrev = m.home_team_abbrev AND m.home_score > m.away_score) OR 
                 (p.team_abbrev = m.away_team_abbrev AND m.away_score > m.home_score) 
            THEN true ELSE false 
          END
      FROM players p, matches m
      WHERE pgs.player_id = p.player_id AND pgs.match_id = m.match_id
    `);

    tracker.log("INFO", "Step 1: Calculating Player Points in batches...");

    const batchSize = 1000;
    let processed = 0;

    while (processed < totalRecords) {
      try {
        await client.query("BEGIN");

        const result = await client.query(`
          WITH target_batch AS (
              SELECT stat_id FROM player_game_stats 
              WHERE is_processed = false 
              LIMIT ${batchSize}
          )
          UPDATE player_game_stats pgs
          SET points_earned = 
            CASE 
              -- 1. FORWARDS & DEFENSE
              WHEN p.position IN ('F', 'D') THEN
                (pgs.goals * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='GOAL') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='GOAL') END) +
                (pgs.assists * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='ASSIST') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='ASSIST') END) +
                (pgs.sog * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='SHOT_ON_GOAL') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='SHOT_ON_GOAL') END) +
                (pgs.blocked_shots * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='BLOCKED_SHOT') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='BLOCKED_SHOT') END) +
                (pgs.hits * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='HIT') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='HIT') END) +
                (pgs.takeaways * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='TAKEAWAY') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='TAKEAWAY') END) +
                (pgs.giveaways * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='GIVEAWAY') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='GIVEAWAY') END) +
                (pgs.pim * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='PIM') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='PIM') END) +
                (CASE 
                  WHEN pgs.is_win = true THEN (SELECT CASE p.position WHEN 'F' THEN forward ELSE defense END FROM scoring_rules WHERE rule_key='WIN')
                  ELSE (SELECT CASE p.position WHEN 'F' THEN forward ELSE defense END FROM scoring_rules WHERE rule_key='LOSS')
                END)
              
              -- 2. GOALIES
              WHEN p.position = 'G' THEN
                (CASE 
                  WHEN pgs.is_win = true THEN (SELECT goalie FROM scoring_rules WHERE rule_key = 'WIN')
                  ELSE (SELECT goalie FROM scoring_rules WHERE rule_key = 'LOSS')
                END) +
                (CASE WHEN pgs.is_shutout = true THEN (SELECT goalie FROM scoring_rules WHERE rule_key = 'SHUTOUT') ELSE 0 END) +
                (pgs.pim * (SELECT goalie FROM scoring_rules WHERE rule_key = 'PIM')) +
                COALESCE((SELECT points FROM goalie_save_points WHERE pgs.saves BETWEEN min_saves AND max_saves), 0) +
                COALESCE((SELECT points FROM goalie_goals_against_penalty gap 
                          WHERE gap.goals_against = pgs.goals_against), 0)
              ELSE 0
            END,
            is_processed = true
          FROM target_batch tb
          -- JOINing players directly to the target_batch, not to pgs
          JOIN players p ON p.player_id = (SELECT player_id FROM player_game_stats WHERE stat_id = tb.stat_id)
          WHERE pgs.stat_id = tb.stat_id
          RETURNING pgs.stat_id;
        `);

        await client.query("COMMIT");
        const currentBatchCount = result.rowCount ?? 0;
        processed += currentBatchCount;
        batchTracker.progress(processed);
        if (currentBatchCount === 0) break;
      } catch (batchError) {
        await client.query("ROLLBACK");
        throw batchError;
      }
    }

    batchTracker.finish();

    tracker.log("INFO", "Step 2: Finalizing Fantasy Team totals from History...");
    await client.query(`
      UPDATE fantasy_teams ft
      SET total_points = COALESCE(sub.total_earned, 0)
      FROM (
        SELECT 
            rh.team_id, 
            SUM(pgs.points_earned * CASE WHEN rh.is_captain THEN 1.3 ELSE 1 END) as total_earned
        FROM roster_history rh
        JOIN matches m ON m.scheduled_at::date = rh.game_date
        JOIN player_game_stats pgs ON (pgs.player_id = rh.player_id AND pgs.match_id = m.match_id)
        GROUP BY rh.team_id
      ) sub
      WHERE ft.team_id = sub.team_id;
    `);

    tracker.finish();
  } catch (error) {
    tracker.log("ERROR", "Fatal error in points seeding", {
      error: String(error),
    });
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedPoints()
    .then(() => {
      console.log("Points calculation complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error in points seeding:", err);
      process.exit(1);
    });
}
