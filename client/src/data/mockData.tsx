export const GM_PLANNER_DATA: Record<
  number,
  { active: number; points: number; budgetChange: string; status: string }
> = {
  27: { active: 6, points: 42, budgetChange: "+$150k", status: "peak" },
  28: { active: 3, points: 12, budgetChange: "+$40k", status: "mid" },
  29: { active: 1, points: 0, budgetChange: "$0", status: "low" },
  30: { active: 5, points: 0, budgetChange: "+$110k", status: "high" },
};


export const MATCH_DATA = [
  { home: "EDM", away: "TOR", time: "02:00", date: "TONIGHT" },
  { home: "MIN", away: "CHI", time: "03:00", date: "TONIGHT" },
  { home: "COL", away: "VGK", time: "04:30", date: "TONIGHT" },
  { home: "NYR", away: "NJD", time: "02:00", date: "TOMORROW" },
  { home: "FLA", away: "TBL", time: "02:30", date: "TOMORROW" },
];

export const PLAYER_POOL = [
  { id: 1, name: "Connor McDavid", pos: "F", team: "EDM", points: 124.5, salary: 300000 },
  { id: 2, name: "Nathan MacKinnon", pos: "F", team: "COL", points: 118.2, salary: 420000 },
  { id: 3, name: "Cale Makar", pos: "D", team: "COL", points: 92.4, salary: 555000 },
  { id: 4, name: "Auston Matthews", pos: "F", team: "TOR", points: 105.3, salary: 678440 },
  { id: 5, name: "Nikita Kucherov", pos: "F", team: "TBL", points: 112.1, salary: 490000 },
  { id: 6, name: "Artemi Panarin", pos: "F", team: "NYR", points: 98.7, salary: 550000 },
  { id: 7, name: "Juuse Saros", pos: "G", team: "NSH", points: 145.0, salary: 430000 },
  { id: 8, name: "Connor Hellebuyck", pos: "G", team: "WPG", points: 152.4, salary: 642000 },
  { id: 9, name: "Adam Fox", pos: "D", team: "NYR", points: 78.9, salary: 185000 },
  { id: 10, name: "Quinn Hughes", pos: "D", team: "VAN", points: 82.4, salary: 320000 },
  { id: 11, name: "Mikko Rantanen", pos: "F", team: "COL", points: 91.2, salary: 533991 },
  { id: 12, name: "Sebastian Aho", pos: "F", team: "CAR", points: 84.5, salary: 410000 },
  { id: 13, name: "Jack Hughes", pos: "F", team: "NJD", points: 88.3, salary: 678440 },
  { id: 14, name: "Elias Pettersson", pos: "F", team: "VAN", points: 85.1, salary: 430000 },
  { id: 15, name: "Jason Robertson", pos: "F", team: "DAL", points: 81.9, salary: 555000 },
  { id: 16, name: "Mitch Marner", pos: "F", team: "TOR", points: 86.4, salary: 620000 },
  { id: 17, name: "William Nylander", pos: "F", team: "TOR", points: 89.2, salary: 490000 },
  { id: 18, name: "David Pastrnak", pos: "F", team: "BOS", points: 95.8, salary: 533991 },
  { id: 19, name: "Leon Draisaitl", pos: "F", team: "EDM", points: 101.4, salary: 430000 },
  { id: 20, name: "Matthew Tkachuk", pos: "F", team: "FLA", points: 88.5, salary: 555000 },
  { id: 21, name: "Roope Hintz", pos: "F", team: "DAL", points: 72.3, salary: 678440 },
  { id: 22, name: "Miro Heiskanen", pos: "D", team: "DAL", points: 68.4, salary: 320000 },
  { id: 23, name: "Aleksander Barkov", pos: "F", team: "FLA", points: 79.2, salary: 550000 },
  { id: 24, name: "Brady Tkachuk", pos: "F", team: "OTT", points: 74.1, salary: 678440 },
  { id: 25, name: "Tim Stützle", pos: "F", team: "OTT", points: 77.8, salary: 300000 },
  { id: 26, name: "Erik Karlsson", pos: "D", team: "PIT", points: 71.2, salary: 490000 },
  { id: 27, name: "Igor Shesterkin", pos: "G", team: "NYR", points: 138.9, salary: 555000 },
  { id: 28, name: "Andrei Vasilevskiy", pos: "G", team: "TBL", points: 122.4, salary: 533991 },
  { id: 29, name: "Sidney Crosby", pos: "F", team: "PIT", points: 84.1, salary: 410000 },
  { id: 30, name: "Victor Hedman", pos: "D", team: "TBL", points: 75.3, salary: 320000 },
  { id: 31, name: "Kirill Kaprizov", pos: "F", team: "MIN", points: 75.3, salary: 350000 },
];

export const TEAM_DATA = [
  { name: "Connor McDavid", abbrev: "EDM", color: "#FF4C00", pos: "F", points: 4.5, salary: 300000 },
  { name: "Auston Matthews", abbrev: "TOR", color: "#00205B", pos: "F", points: 2.0, salary: 400000 },
  { name: "Kirill Kaprizov", abbrev: "MIN", color: "#154734", pos: "F", points: 3.5, salary: 350000 },
  { name: "Cale Makar", abbrev: "COL", color: "#6F263D", pos: "D", points: 2.5, salary: 450000 },
  { name: "Erik Karlsson", abbrev: "PIT", color: "#FCB514", pos: "D", points: 1.0, salary: 300000 },
  { name: "Connor Hellebuyck", abbrev: "WPG", color: "#041E42", pos: "G", points: 6.0, salary: 500000 },
];

export const LEAGUE_PERIODS = [
  { id: 1, label: "Period 1", status: "past" },
  { id: 2, label: "Period 2", status: "past" },
  { id: 3, label: "Period 3", status: "current" },
  { id: 4, label: "Period 4", status: "locked" },
  { id: 5, label: "Period 5", status: "locked" },
  { id: 6, label: "Full Season", status: "current" },
];

export const PERIOD_DATA: Record<number, any[]> = {
  1: [
    { rank: 1, previousRank: 1, name: "HELSINKI ICE", manager: "Ville V.", points: 842, lastDayPoints: 45, isUser: false },
    { rank: 2, previousRank: 2, name: "TAMPERE TITANS", manager: "Mikko S.", points: 810, lastDayPoints: 30, isUser: false },
    { rank: 3, previousRank: 5, name: "NORDIC GIANTS", manager: "Anders K.", points: 795, lastDayPoints: 88, isUser: false },
    { rank: 4, previousRank: 3, name: "MY TEAM (YOU)", manager: "Matti M.", points: 780, lastDayPoints: 12, isUser: true },
    { rank: 5, previousRank: 4, name: "LAPLAND LIONS", manager: "Eero J.", points: 740, lastDayPoints: 5, isUser: false },
    { rank: 6, previousRank: 6, name: "BALTIC BEARS", manager: "Lukas P.", points: 710, lastDayPoints: 22, isUser: false },
    { rank: 7, previousRank: 7, name: "SNOOZE PATROL", manager: "Pekka H.", points: 620, lastDayPoints: 41, isUser: false },
  ],
  2: [
    { rank: 1, previousRank: 3, name: "NORDIC GIANTS", manager: "Anders K.", points: 1120, lastDayPoints: 105, isUser: false },
    { rank: 2, previousRank: 1, name: "HELSINKI ICE", manager: "Ville V.", points: 1080, lastDayPoints: 15, isUser: false },
    { rank: 3, previousRank: 4, name: "MY TEAM (YOU)", manager: "Matti M.", points: 1050, lastDayPoints: 92, isUser: true },
    { rank: 4, previousRank: 2, name: "TAMPERE TITANS", manager: "Mikko S.", points: 990, lastDayPoints: 8, isUser: false },
    { rank: 5, previousRank: 6, name: "BALTIC BEARS", manager: "Lukas P.", points: 850, lastDayPoints: 60, isUser: false },
    { rank: 6, previousRank: 5, name: "LAPLAND LIONS", manager: "Eero J.", points: 810, lastDayPoints: 10, isUser: false },
    { rank: 7, previousRank: 7, name: "SNOOZE PATROL", manager: "Pekka H.", points: 750, lastDayPoints: 33, isUser: false },
  ],
  3: [
    { rank: 1, previousRank: 2, name: "HELSINKI ICE", manager: "Ville V.", points: 1195, lastDayPoints: 115, isUser: false },
    { rank: 2, previousRank: 1, name: "NORDIC GIANTS", manager: "Anders K.", points: 1150, lastDayPoints: 30, isUser: false },
    { rank: 3, previousRank: 3, name: "MY TEAM (YOU)", manager: "Matti M.", points: 1120, lastDayPoints: 70, isUser: true },
    { rank: 4, previousRank: 5, name: "BALTIC BEARS", manager: "Lukas P.", points: 980, lastDayPoints: 130, isUser: false },
    { rank: 5, previousRank: 4, name: "TAMPERE TITANS", manager: "Mikko S.", points: 940, lastDayPoints: 12, isUser: false },
    { rank: 6, previousRank: 7, name: "SNOOZE PATROL", manager: "Pekka H.", points: 820, lastDayPoints: 70, isUser: false },
    { rank: 7, previousRank: 6, name: "LAPLAND LIONS", manager: "Eero J.", points: 790, lastDayPoints: 5, isUser: false },
  ],
  4: [
    { rank: 1, previousRank: 2, name: "NORDIC GIANTS", manager: "Anders K.", points: 1045, lastDayPoints: 92, isUser: false },
    { rank: 2, previousRank: 1, name: "HELSINKI ICE", manager: "Ville V.", points: 1032, lastDayPoints: 40, isUser: false },
    { rank: 3, previousRank: 4, name: "BALTIC BEARS", manager: "Lukas P.", points: 998, lastDayPoints: 112, isUser: false },
    { rank: 4, previousRank: 3, name: "MY TEAM (YOU)", manager: "Matti M.", points: 985, lastDayPoints: 55, isUser: true },
    { rank: 5, previousRank: 5, name: "TAMPERE TITANS", manager: "Mikko S.", points: 910, lastDayPoints: 20, isUser: false },
    { rank: 6, previousRank: 6, name: "SNOOZE PATROL", manager: "Pekka H.", points: 885, lastDayPoints: 65, isUser: false },
    { rank: 7, previousRank: 7, name: "LAPLAND LIONS", manager: "Eero J.", points: 805, lastDayPoints: 15, isUser: false },
  ],
  5: [
    { rank: 1, previousRank: 1, name: "NORDIC GIANTS", manager: "Anders K.", points: 1180, lastDayPoints: 135, isUser: false },
    { rank: 2, previousRank: 4, name: "MY TEAM (YOU)", manager: "Matti M.", points: 1105, lastDayPoints: 120, isUser: true },
    { rank: 3, previousRank: 2, name: "HELSINKI ICE", manager: "Ville V.", points: 1090, lastDayPoints: 58, isUser: false },
    { rank: 4, previousRank: 3, name: "BALTIC BEARS", manager: "Lukas P.", points: 1050, lastDayPoints: 52, isUser: false },
    { rank: 5, previousRank: 6, name: "SNOOZE PATROL", manager: "Pekka H.", points: 995, lastDayPoints: 110, isUser: false },
    { rank: 6, previousRank: 5, name: "TAMPERE TITANS", manager: "Mikko S.", points: 940, lastDayPoints: 30, isUser: false },
    { rank: 7, previousRank: 7, name: "LAPLAND LIONS", manager: "Eero J.", points: 820, lastDayPoints: 15, isUser: false },
  ],
};

// FULL SEASON (Aggregate testing)
export const FULL_SEASON_DATA = [
  { rank: 1, previousRank: 1, name: "NORDIC GIANTS", manager: "Anders K.", points: 5120, lastDayPoints: 135, isUser: false },
  { rank: 2, previousRank: 3, name: "HELSINKI ICE", manager: "Ville V.", points: 4980, lastDayPoints: 58, isUser: false },
  { rank: 3, previousRank: 2, name: "MY TEAM (YOU)", manager: "Matti M.", points: 4850, lastDayPoints: 120, isUser: true },
  { rank: 4, previousRank: 4, name: "TAMPERE TITANS", manager: "Mikko S.", points: 4500, lastDayPoints: 30, isUser: false },
  { rank: 5, previousRank: 5, name: "BALTIC BEARS", manager: "Lukas P.", points: 4200, lastDayPoints: 52, isUser: false },
  { rank: 6, previousRank: 7, name: "SNOOZE PATROL", manager: "Pekka H.", points: 4050, lastDayPoints: 110, isUser: false },
  { rank: 7, previousRank: 6, name: "LAPLAND LIONS", manager: "Eero J.", points: 3800, lastDayPoints: 15, isUser: false },
];

export const LEAGUE_RECORDS = {
  lastNight: [
    { label: "Goals", team: "HELSINKI ICE", value: 4 },
    { label: "Points", team: "TAMPERE TITANS", value: 8 },
    { label: "Penalties ", team: "HELSINKI ICE", value: 5 },
    { label: "League Points", team: "HELSINKI ICE", value: 105 },
  ],
  seasonBest: [
    { label: "Goals", team: "BALTIC BEARS", value: 4 },
    { label: "Points", team: "TAMPERE TITANS", value: 8 },
    { label: "Penalties", team: "BALTIC BEARS", value: 19 },
    { label: "League Points", team: "NORDIC GIANTS", value: 125 },
  ]
};