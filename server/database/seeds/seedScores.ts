import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

function parseTOI(toi: string): number {
  if (!toi || toi === "00:00") return 0;
  const [minutes = 0, seconds = 0] = toi.split(':').map(val => Number(val) || 0);  
  return (minutes * 60) + seconds;
}

export async function seedRawStats() {
  const { rows: matches } = await pool.query(
    "SELECT api_id, match_id FROM matches WHERE scheduled_at < NOW() AND is_processed = false"
  );

  const tracker = new Logger("STATS_SEED", matches.length);
  tracker.log('INFO', `Found ${matches.length} unprocessed matches to sync.`);

  for (const match of matches) {
    try {
      const response = await fetch(`https://api-web.nhle.com/v1/gamecenter/${match.api_id}/boxscore`);
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.playerByGameStats) continue;

      const teams = [data.playerByGameStats.homeTeam, data.playerByGameStats.awayTeam];

      for (const teamData of teams) {
        const skaters = [...(teamData.forwards || []), ...(teamData.defense || [])];
        for (const s of skaters) {
          await pool.query(
            `INSERT INTO player_game_stats (
              player_id, match_id, goals, assists, plus_minus, sog, pim, hits, 
              blocked_shots, shifts, giveaways, takeaways, power_play_goals, toi_seconds
            )
            SELECT player_id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 
            FROM players WHERE api_id = $14
            ON CONFLICT (player_id, match_id) DO UPDATE SET 
              goals = EXCLUDED.goals, assists = EXCLUDED.assists, plus_minus = EXCLUDED.plus_minus,
              sog = EXCLUDED.sog, pim = EXCLUDED.pim, hits = EXCLUDED.hits, 
              blocked_shots = EXCLUDED.blocked_shots, shifts = EXCLUDED.shifts,
              giveaways = EXCLUDED.giveaways, takeaways = EXCLUDED.takeaways,
              power_play_goals = EXCLUDED.power_play_goals, toi_seconds = EXCLUDED.toi_seconds`,
            [
              match.match_id, s.goals, s.assists, s.plusMinus, s.sog, s.pim, s.hits,
              s.blockedShots, s.shifts, s.giveaways, s.takeaways, s.powerPlayGoals, 
              parseTOI(s.toi), s.playerId
            ]
          );
        }

        for (const g of teamData.goalies || []) {
          await pool.query(
            `INSERT INTO player_game_stats (
              player_id, match_id, saves, goals_against, shots_against, 
              is_starter, toi_seconds, pim, is_processed
            )
            SELECT player_id, $1, $2, $3, $4, $5, $6, $7, false 
            FROM players WHERE api_id = $8
            ON CONFLICT (player_id, match_id) DO UPDATE SET 
              saves = EXCLUDED.saves, goals_against = EXCLUDED.goals_against,
              shots_against = EXCLUDED.shots_against, is_starter = EXCLUDED.is_starter,
              toi_seconds = EXCLUDED.toi_seconds, pim = EXCLUDED.pim`,
            [
              match.match_id, g.saves, g.goalsAgainst, g.shotsAgainst, 
              g.starter ?? false, parseTOI(g.toi), g.pim, g.playerId
            ]
          );
        }
      }

      const isFinished = data.gameState === 'OFF' || data.gameState === 'FINAL';
      await pool.query(
        "UPDATE matches SET home_score = $1, away_score = $2, is_processed = $3 WHERE match_id = $4",
        [data.homeTeam.score, data.awayTeam.score, isFinished, match.match_id]
      );

      tracker.progress(`MATCH_${match.api_id}`);
    } catch (error) {
      tracker.log('ERROR', `Failed match ${match.api_id}`, { error: String(error) });
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