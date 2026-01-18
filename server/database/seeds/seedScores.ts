import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

export async function seedRawStats() {
  const { rows: matches } = await pool.query(
    "SELECT api_id, match_id FROM matches WHERE scheduled_at < NOW() AND is_processed = false"
  );

  const tracker = new Logger("STATS_SEED", matches.length);
  tracker.log('INFO', `Found ${matches.length} unprocessed matches to sync.`);

  for (const match of matches) {
    try {
      const response = await fetch(
        `https://api-web.nhle.com/v1/gamecenter/${match.api_id}/boxscore`
      );

      if (!response.ok) {
        tracker.log('WARN', `API unreachable for match`, { api_id: match.api_id, status: response.status });
        tracker.progress(`MATCH_${match.api_id}`);
        continue;
      }

      const data = await response.json();
      
      if (!data.playerByGameStats) {
        tracker.log('INFO', `No stats available yet for match ${match.api_id}`);
        tracker.progress(`MATCH_${match.api_id}`);
        continue;
      }

      const teams = [data.playerByGameStats.homeTeam, data.playerByGameStats.awayTeam];

      for (const teamData of teams) {
        const skaters = [...(teamData.forwards || []), ...(teamData.defense || [])];
        const goalies = teamData.goalies || [];

        for (const s of skaters) {
          await pool.query(
            `INSERT INTO player_game_stats (player_id, match_id, goals, assists, saves)
             SELECT player_id, $1, $2, $3, 0 FROM players WHERE api_id = $4
             ON CONFLICT (player_id, match_id) DO UPDATE SET 
             goals = EXCLUDED.goals, assists = EXCLUDED.assists`,
            [match.match_id, s.goals, s.assists, s.playerId]
          );
        }

        for (const g of goalies) {
          await pool.query(
            `INSERT INTO player_game_stats (player_id, match_id, saves, goals, assists)
             SELECT player_id, $1, $2, 0, 0 FROM players WHERE api_id = $3
             ON CONFLICT (player_id, match_id) DO UPDATE SET 
             saves = EXCLUDED.saves`,
            [match.match_id, g.saves, g.playerId]
          );
        }
      }

      await pool.query(
        "UPDATE matches SET home_score = $1, away_score = $2, is_processed = true WHERE match_id = $3",
        [data.homeScore?.value || 0, data.awayScore?.value || 0, match.match_id]
      );

      tracker.progress(`MATCH_${match.api_id}`);

    } catch (error) {
      tracker.log('ERROR', `Failed to process match stats`, {
        match_id: match.match_id,
        api_id: match.api_id,
        error: error instanceof Error ? error.message : String(error)
      });
      tracker.progress(`MATCH_${match.api_id}`);
    }
  }

  tracker.finish();
}

if (require.main === module || (process.argv[1] && process.argv[1].includes('seedScores'))) {
  seedRawStats()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[FATAL] Stats seed failed:", err);
      process.exit(1);
    });
}