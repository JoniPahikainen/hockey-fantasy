import pool from "../../src/db";

export const NHL_TEAMS = [
  { abbreviation: "ANA", team_id: 24, full_name: "Anaheim Ducks", primary_color: "#F47A38" },
  { abbreviation: "UTA", team_id: 59, full_name: "Utah Hockey Club", primary_color: "#71AFE2" },
  { abbreviation: "BOS", team_id: 6,  full_name: "Boston Bruins", primary_color: "#FFB81C" },
  { abbreviation: "BUF", team_id: 7,  full_name: "Buffalo Sabres", primary_color: "#002654" },
  { abbreviation: "CGY", team_id: 20, full_name: "Calgary Flames", primary_color: "#C8102E" },
  { abbreviation: "CAR", team_id: 12, full_name: "Carolina Hurricanes", primary_color: "#CE1126" },
  { abbreviation: "CHI", team_id: 16, full_name: "Chicago Blackhawks", primary_color: "#CF0A2C" },
  { abbreviation: "COL", team_id: 21, full_name: "Colorado Avalanche", primary_color: "#6F263D" },
  { abbreviation: "CBJ", team_id: 29, full_name: "Columbus Blue Jackets", primary_color: "#002654" },
  { abbreviation: "DAL", team_id: 25, full_name: "Dallas Stars", primary_color: "#006847" },
  { abbreviation: "DET", team_id: 17, full_name: "Detroit Red Wings", primary_color: "#CE1126" },
  { abbreviation: "EDM", team_id: 22, full_name: "Edmonton Oilers", primary_color: "#FF4C00" },
  { abbreviation: "FLA", team_id: 13, full_name: "Florida Panthers", primary_color: "#041E42" },
  { abbreviation: "LAK", team_id: 26, full_name: "Los Angeles Kings", primary_color: "#111111" },
  { abbreviation: "MIN", team_id: 30, full_name: "Minnesota Wild", primary_color: "#154734" },
  { abbreviation: "MTL", team_id: 8,  full_name: "Montreal Canadiens", primary_color: "#AF1E2D" },
  { abbreviation: "NSH", team_id: 18, full_name: "Nashville Predators", primary_color: "#FFB81C" },
  { abbreviation: "NJD", team_id: 1,  full_name: "New Jersey Devils", primary_color: "#CE1126" },
  { abbreviation: "NYI", team_id: 2,  full_name: "New York Islanders", primary_color: "#00539B" },
  { abbreviation: "NYR", team_id: 3,  full_name: "New York Rangers", primary_color: "#0038A8" },
  { abbreviation: "OTT", team_id: 9,  full_name: "Ottawa Senators", primary_color: "#C8102E" },
  { abbreviation: "PHI", team_id: 4,  full_name: "Philadelphia Flyers", primary_color: "#F74902" },
  { abbreviation: "PIT", team_id: 5,  full_name: "Pittsburgh Penguins", primary_color: "#FCB514" },
  { abbreviation: "SJS", team_id: 28, full_name: "San Jose Sharks", primary_color: "#006D75" },
  { abbreviation: "SEA", team_id: 55, full_name: "Seattle Kraken", primary_color: "#001628" },
  { abbreviation: "STL", team_id: 19, full_name: "St. Louis Blues", primary_color: "#002F87" },
  { abbreviation: "TBL", team_id: 14, full_name: "Tampa Bay Lightning", primary_color: "#002868" },
  { abbreviation: "TOR", team_id: 10, full_name: "Toronto Maple Leafs", primary_color: "#00205B" },
  { abbreviation: "VAN", team_id: 23, full_name: "Vancouver Canucks", primary_color: "#00205B" },
  { abbreviation: "VGK", team_id: 54, full_name: "Vegas Golden Knights", primary_color: "#B4975A" },
  { abbreviation: "WSH", team_id: 15, full_name: "Washington Capitals", primary_color: "#C8102E" },
  { abbreviation: "WPG", team_id: 52, full_name: "Winnipeg Jets", primary_color: "#041E42" },
];

export async function seedTeams() {
  console.log("⏳ Seeding NHL teams...");
  
  try {
    for (const team of NHL_TEAMS) {
      await pool.query( // Changed 'db' to 'pool' to match your export
        `INSERT INTO real_teams (abbreviation, team_id, full_name, primary_color)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (abbreviation) 
         DO UPDATE SET 
            team_id = EXCLUDED.team_id,
            full_name = EXCLUDED.full_name,
            primary_color = EXCLUDED.primary_color`,
        [team.abbreviation, team.team_id, team.full_name, team.primary_color]
      );
    }
    console.log("✅ Successfully seeded 32 NHL teams.");
  } catch (error) {
    console.error("❌ Error seeding teams:", error);
    throw error;
  }
}

if (require.main === module) {
    seedTeams().then(() => process.exit(0)).catch(() => process.exit(1));
}