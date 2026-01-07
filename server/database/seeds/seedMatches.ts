import pool from "../../src/db";

export async function seedMatches() {
  console.log("Starting NHL Match (Schedule) seed for 2025-26...");

  try {
    const { rows: teams } = await pool.query(
      "SELECT abbreviation FROM real_teams"
    );

    for (const team of teams) {
      const abbrev = team.abbreviation;
      console.log(`  Fetching schedule for ${abbrev}...`);

      const response = await fetch(
        `https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/now`
      );

      if (!response.ok) {
        console.error(`Could not fetch schedule for ${abbrev}`);
        continue;
      }

      const data = await response.json();
      const games = data.games || [];

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
          [gameApiId, homeTeam, awayTeam, startTime]
        );
      }

      await new Promise((res) => setTimeout(res, 150));
    }

    console.log("All matches for the 2025-26 season seeded!");
  } catch (error) {
    console.error("Match seeding failed:", error);
  }
}

if (
  require.main === module ||
  (process.argv[1] && process.argv[1].includes("seedMatches"))
) {
  seedMatches()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
