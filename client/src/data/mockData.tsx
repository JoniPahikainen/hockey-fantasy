export const GM_PLANNER_DATA: Record<
  number,
  { active: number; points: number; budgetChange: string; status: string }
> = {
  27: { active: 6, points: 42, budgetChange: "+$150k", status: "peak" },
  28: { active: 3, points: 12, budgetChange: "+$40k", status: "mid" },
  29: { active: 1, points: 0, budgetChange: "$0", status: "low" },
  30: { active: 5, points: 0, budgetChange: "+$110k", status: "high" },
};

export const TEAM_DATA = [
  {
    name: "Connor McDavid",
    abbrev: "EDM",
    color: "#FF4C00",
    pos: "F",
    points: 4.5,
  },
  {
    name: "Auston Matthews",
    abbrev: "TOR",
    color: "#00205B",
    pos: "F",
    points: 2.0,
  },
  {
    name: "Kirill Kaprizov",
    abbrev: "MIN",
    color: "#154734",
    pos: "F",
    points: 3.5,
  },
  {
    name: "Cale Makar",
    abbrev: "COL",
    color: "#6F263D",
    pos: "D",
    points: 2.5,
  },
  {
    name: "Erik Karlsson",
    abbrev: "PIT",
    color: "#FCB514",
    pos: "D",
    points: 1.0,
  },
  {
    name: "Connor Hellebuyck",
    abbrev: "WPG",
    color: "#041E42",
    pos: "G",
    points: 6.0,
  },
];

export const MATCH_DATA = [
  { home: "EDM", away: "TOR", time: "02:00", date: "TONIGHT" },
  { home: "MIN", away: "CHI", time: "03:00", date: "TONIGHT" },
  { home: "COL", away: "VGK", time: "04:30", date: "TONIGHT" },
  { home: "NYR", away: "NJD", time: "02:00", date: "TOMORROW" },
  { home: "FLA", away: "TBL", time: "02:30", date: "TOMORROW" },
];

export const allTeams = [
  { rank: 1, name: "HELSINKI ICE", points: 842, isUser: false },
  { rank: 2, name: "NORDIC GIANTS", points: 815, isUser: false },
  { rank: 3, name: "TAMPERE TITANS", points: 810, isUser: false },
  { rank: 4, name: "MY TEAM (YOU)", points: 795, isUser: true },
  { rank: 5, name: "LAPLAND LIONS", points: 780, isUser: false },
  { rank: 6, name: "BALTIC BEARS", points: 740, isUser: false },
  { rank: 7, name: "SNOOZE PATROL", points: 710, isUser: false },
];
