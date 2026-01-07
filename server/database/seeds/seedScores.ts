import pool from "../../src/db";

async function updatePlayerScores() {
  console.log("Checking for matches that need scores...");

  try {
    const { rows: matches } = await pool.query(
      "SELECT api_id, match_id FROM matches WHERE scheduled_at < NOW() AND is_processed = false"
    );

    const total = matches.length;
    if (total === 0) {
      console.log("No pending matches found to process.");
      return;
    }

    console.log(`Found ${total} matches. Fetching stats...`);

    let current = 0;

    for (const match of matches) {
      current++;

      process.stdout.write(
        `\rProgress: ${current}/${total} matches processed...`
      );

      const response = await fetch(
        `https://api-web.nhle.com/v1/gamecenter/${match.api_id}/boxscore`
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (!data.playerByGameStats) continue;

      const homeTeam = data.playerByGameStats.homeTeam;
      const awayTeam = data.playerByGameStats.awayTeam;
      const teams = [homeTeam, awayTeam];

      for (const teamData of teams) {
        const skaters = [
          ...(teamData.forwards || []),
          ...(teamData.defense || []),
        ];
        const goalies = teamData.goalies || [];

        for (const s of skaters) {
          const points = s.goals * 3 + s.assists * 2;
          await pool.query(
            `INSERT INTO player_game_stats (player_id, match_id, goals, assists, points_earned)
             SELECT player_id, $1, $2, $3, $4 FROM players WHERE api_id = $5
             ON CONFLICT (player_id, match_id) DO UPDATE SET 
             goals = EXCLUDED.goals, assists = EXCLUDED.assists, points_earned = EXCLUDED.points_earned`,
            [match.match_id, s.goals, s.assists, points, s.playerId]
          );
        }

        for (const g of goalies) {
          const gPoints = g.saves * 0.2;
          await pool.query(
            `INSERT INTO player_game_stats (player_id, match_id, saves, points_earned)
             SELECT player_id, $1, $2, $3 FROM players WHERE api_id = $4
             ON CONFLICT (player_id, match_id) DO UPDATE SET 
             saves = EXCLUDED.saves, points_earned = EXCLUDED.points_earned`,
            [match.match_id, g.saves, gPoints, g.playerId]
          );
        }
      }

      await pool.query(
        "UPDATE matches SET home_score = $1, away_score = $2, is_processed = true WHERE match_id = $3",
        [data.homeScore?.value || 0, data.awayScore?.value || 0, match.match_id]
      );
    }

    process.stdout.write("\n");

    console.log("Updating User Team totals...");
    await pool.query(`
      UPDATE teams
      SET total_points = (
        SELECT COALESCE(SUM(pgs.points_earned), 0)
        FROM rosters r
        JOIN player_game_stats pgs ON r.player_id = pgs.player_id
        WHERE r.team_id = teams.team_id
      )
    `);
    console.log("User Leaderboards updated.");
  } catch (error) {
    console.error("\nScoring process failed:", error);
  }
}

const isMainModule = require.main === module;
if (
  isMainModule ||
  (process.argv[1] && process.argv[1].includes("seedScores"))
) {
  updatePlayerScores().then(() => {
    console.log("All available scores updated.");
    process.exit(0);
  });
}
