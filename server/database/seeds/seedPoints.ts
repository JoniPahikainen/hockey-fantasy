import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

export async function seedPoints() {
  const client = await pool.connect();
  const tracker = new Logger("POINTS_CALC");

  try {
    tracker.log('INFO', "Initializing points calculation and batch sync.");

    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM player_game_stats) as stats_count,
        (SELECT COUNT(*) FROM fantasy_teams) as team_count
    `);
    const totalRecords = parseInt(counts.rows[0].stats_count);
    const totalTeams = parseInt(counts.rows[0].team_count);

    const batchTracker = new Logger("POINTS_BATCH", totalRecords);
    tracker.log('INFO', `Stat Records: ${totalRecords} | Fantasy Teams: ${totalTeams}`);

    tracker.log('INFO', "Step 0: Resetting points_earned on all records...");
    await client.query("UPDATE player_game_stats SET points_earned = 0, is_processed = false");

    tracker.log('INFO', "Step 1: Calculating Player Points in batches...");
    
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
          UPDATE player_game_stats
          SET points_earned = 
            CASE 
              WHEN p.position IN ('F', 'D') THEN
                (player_game_stats.goals * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='GOAL') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='GOAL') END) +
                (player_game_stats.assists * CASE p.position WHEN 'F' THEN (SELECT forward FROM scoring_rules WHERE rule_key='ASSIST') ELSE (SELECT defense FROM scoring_rules WHERE rule_key='ASSIST') END)
              
              WHEN p.position = 'G' THEN
                (CASE 
                  WHEN ((p.team_abbrev = m.home_team_abbrev AND m.home_score > m.away_score)
                     OR (p.team_abbrev = m.away_team_abbrev AND m.away_score > m.home_score))
                  THEN (SELECT goalie FROM scoring_rules WHERE rule_key = 'WIN')
                  ELSE (SELECT goalie FROM scoring_rules WHERE rule_key = 'LOSS')
                END) +
                COALESCE((SELECT points FROM goalie_save_points WHERE player_game_stats.saves BETWEEN min_saves AND max_saves), 0) +
                COALESCE((SELECT points FROM goalie_goals_against_penalty gap 
                          WHERE (p.team_abbrev = m.home_team_abbrev AND gap.goals_against = m.away_score)
                             OR (p.team_abbrev = m.away_team_abbrev AND gap.goals_against = m.home_score)), 0)
              ELSE 0
            END,
            is_processed = true
          FROM target_batch tb
          JOIN players p ON p.player_id = (SELECT player_id FROM player_game_stats WHERE stat_id = tb.stat_id)
          JOIN matches m ON m.match_id = (SELECT match_id FROM player_game_stats WHERE stat_id = tb.stat_id)
          WHERE player_game_stats.stat_id = tb.stat_id
          RETURNING player_game_stats.stat_id;
        `);

        await client.query("COMMIT");

        const currentBatchCount = result.rowCount ?? 0;
        processed += currentBatchCount;


        batchTracker.progress(`BATCH_UP_TO_${processed}`);

        if (currentBatchCount === 0) break; 
      } catch (batchError) {
        await client.query("ROLLBACK");
        tracker.log('ERROR', `Batch failure at ${processed} records`, { error: String(batchError) });
        throw batchError;
      }
    }

    batchTracker.finish();

    tracker.log('INFO', "Step 2: Finalizing Fantasy Team totals...");
    const teamStart = Date.now();
    await client.query(`
      UPDATE fantasy_teams ft
      SET total_points = COALESCE(sub.team_total, 0)
      FROM (
        SELECT ftp.team_id, 
               SUM(pgs.points_earned * CASE WHEN ftp.is_captain THEN 1.3 ELSE 1 END) as team_total
        FROM fantasy_team_players ftp
        JOIN player_game_stats pgs ON ftp.player_id = pgs.player_id
        GROUP BY ftp.team_id
      ) sub
      WHERE ft.team_id = sub.team_id;
    `);
    
    tracker.log('INFO', `Team totals updated in ${Date.now() - teamStart}ms`);
    tracker.finish();

  } catch (error) {
    tracker.log('ERROR', "Fatal error in points seeding", { error: String(error) });
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedPoints().then(() => process.exit(0));
}