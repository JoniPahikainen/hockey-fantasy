import pool from "../../src/db";

export async function seedMatches() {
  console.log("⏳ Starting NHL Match (Schedule) seed for 2025-26...");

  try {
    // 1. Get all teams to loop through their schedules
    const { rows: teams } = await pool.query("SELECT abbreviation FROM real_teams");

    for (const team of teams) {
      const abbrev = team.abbreviation;
      console.log(`  Fetching schedule for ${abbrev}...`);

      // This endpoint gets the full season schedule for a specific team
      const response = await fetch(`https://api-web.nhle.com/v1/club-schedule-season/${abbrev}/now`);
      
      if (!response.ok) {
        console.error(`  ⚠️ Could not fetch schedule for ${abbrev}`);
        continue;
      }

      const data = await response.json();
      const games = data.games || [];

      for (const g of games) {
        const gameApiId = g.id;
        const homeTeam = g.homeTeam.abbrev;
        const awayTeam = g.awayTeam.abbrev;
        const startTime = g.startTimeUTC; // Format: "2025-10-07T23:00:00Z"
        const gameType = g.gameType; // 2 is Regular Season

        // 2. We only care about Regular Season (2) or Playoffs (3)
        if (gameType !== 2 && gameType !== 3) continue;

        // 3. Upsert into matches table
        await pool.query(
          `INSERT INTO matches (api_id, home_team_abbrev, away_team_abbrev, scheduled_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (api_id) 
           DO UPDATE SET 
              scheduled_at = EXCLUDED.scheduled_at`,
          [gameApiId, homeTeam, awayTeam, startTime]
        );
      }

      // Small delay to prevent rate limiting
      await new Promise(res => setTimeout(res, 150));
    }

    console.log("✅ All matches for the 2025-26 season seeded!");
  } catch (error) {
    console.error("❌ Match seeding failed:", error);
  }
}

// Execution block for running directly
if (require.main === module || (process.argv[1] && process.argv[1].includes('seedMatches'))) {
    seedMatches().then(() => process.exit(0)).catch(() => process.exit(1));
} 