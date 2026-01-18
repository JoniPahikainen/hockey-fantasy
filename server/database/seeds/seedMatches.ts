import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

export async function seedMatches() {
  const { rows: teams } = await pool.query(
    "SELECT abbreviation FROM real_teams",
  );

  const tracker = new Logger("MATCH_SEED", teams.length);
  tracker.log("INFO", "Starting NHL Match (Schedule) seed for 2025-26.");

  for (const team of teams) {
    const abbrev = team.abbreviation;

    try {
      const response = await fetch(
        `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/now`,
      );

      if (!response.ok) {
        tracker.log("WARN", `Could not fetch schedule`, {
          team: abbrev,
          status: response.status,
        });
        tracker.progress(abbrev);
        continue;
      }

      const data = await response.json();
      const games = data.games || [];
      let savedCount = 0;

      for (const g of games) {
        const gameApiId = g.id;
        const homeTeam = g.homeTeam.abbrev;
        const awayTeam = g.awayTeam.abbrev;
        const startTime = g.startTimeUTC;
        const gameType = g.gameType;

        if (gameType !== 2 && gameType !== 3) continue;

        await pool.query(
          `INSERT INTO matches (api_id, home_team_abbrev, away_team_abbrev, scheduled_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (api_id) 
           DO UPDATE SET 
              scheduled_at = EXCLUDED.scheduled_at`,
          [gameApiId, homeTeam, awayTeam, startTime],
        );
        savedCount++;
      }

      tracker.progress(abbrev);

      await new Promise((res) => setTimeout(res, 150));
    } catch (error) {
      tracker.log("ERROR", `Exception during schedule sync`, {
        team: abbrev,
        error: error instanceof Error ? error.message : String(error),
      });
      tracker.progress(abbrev);
    }
  }

  tracker.finish();
}

if (
  require.main === module ||
  (process.argv[1] && process.argv[1].includes("seedMatches"))
) {
  seedMatches()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[FATAL] Match seed process failed:", err);
      process.exit(1);
    });
}
