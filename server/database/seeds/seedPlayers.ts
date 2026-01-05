import pool from "../../src/db";

function mapPosition(nhlPos: string): 'G' | 'D' | 'F' {
  if (nhlPos === 'G') return 'G';
  if (nhlPos === 'D') return 'D';
  return 'F'; 
}

export async function seedPlayers() {
  console.log("Starting NHL Player seed...");

  try {
    const { rows: teams } = await pool.query("SELECT abbreviation FROM real_teams");

    for (const team of teams) {
      const abbrev = team.abbreviation;
      console.log(`Fetching roster for ${abbrev}...`);

      const response = await fetch(`https://api-web.nhle.com/v1/roster/${abbrev}/current`);
      
      if (!response.ok) {
        console.error(`Could not fetch roster for ${abbrev}`);
        continue;
      }

      const data = await response.json();
      
      const allPlayers = [
        ...data.forwards,
        ...data.defensemen,
        ...data.goalies
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
          [apiId, firstName, lastName, position, abbrev, defaultPrice]
        );
      }

      await new Promise(res => setTimeout(res, 200));
    }

    console.log("All NHL players seeded!");
  } catch (error) {
    console.error("Player seeding failed:", error);
  }
}

const isMainModule = require.main === module;
const isCalledViaArgv = process.argv[1] && process.argv[1].includes('seedPlayers');

if (isMainModule || isCalledViaArgv) {
  seedPlayers()
    .then(() => {
      console.log("Seed process finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed process failed:", err);
      process.exit(1);
    });
}