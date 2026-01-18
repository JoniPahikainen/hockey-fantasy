import pool from "../../src/db";
import { Logger } from "../../src/utils/logger";

function mapPosition(nhlPos: string): "G" | "D" | "F" {
  if (nhlPos === "G") return "G";
  if (nhlPos === "D") return "D";
  return "F";
}

export async function seedPlayers() {
  const { rows: teams } = await pool.query(
    "SELECT abbreviation FROM real_teams",
  );

  const tracker = new Logger("PLAYER_SEED", teams.length);
  tracker.log("INFO", "Starting roster synchronization for all teams.");

  for (const team of teams) {
    const abbrev = team.abbreviation;

    try {
      const response = await fetch(
        `https://api-web.nhle.com/v1/roster/${abbrev}/current`,
      );

      if (!response.ok) {
        tracker.log("ERROR", `Could not fetch roster`, {
          team: abbrev,
          status: response.status,
        });
        tracker.progress(abbrev);
        continue;
      }

      const data = await response.json();
      const allPlayers = [
        ...(data.forwards || []),
        ...(data.defensemen || []),
        ...(data.goalies || []),
      ];

      for (const p of allPlayers) {
        const firstName = p.firstName.default;
        const lastName = p.lastName.default;
        const position = mapPosition(p.positionCode);
        const apiId = p.id;
        const defaultPrice = 250000;

        await pool.query(
          `INSERT INTO players (api_id, first_name, last_name, position, team_abbrev, current_price)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (api_id) 
           DO UPDATE SET 
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             position = EXCLUDED.position,
             team_abbrev = EXCLUDED.team_abbrev`,
          [apiId, firstName, lastName, position, abbrev, defaultPrice],
        );
      }

      tracker.progress(abbrev);
      await new Promise((res) => setTimeout(res, 200));
    } catch (error) {
      tracker.log("ERROR", `Exception during team processing`, {
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
  (process.argv[1] && process.argv[1].includes("seedPlayers"))
) {
  seedPlayers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("FATAL ERROR:", err);
      process.exit(1);
    });
}
