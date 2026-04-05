import pool from "../db";

export const findAllPlayersWithStats = async () => {
  const query = `
      SELECT 
        p.player_id AS id,
        p.first_name || ' ' || p.last_name AS name,
        p.position AS pos,
        p.team_abbrev AS team,
        p.current_price AS salary,
        COALESCE(SUM(pgs.points_earned), 0) AS points,
        t.primary_color AS color
      FROM players p
      LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
      LEFT JOIN real_teams t ON p.team_abbrev = t.abbreviation
      GROUP BY p.player_id, p.first_name, p.last_name, p.position, p.team_abbrev, p.current_price, t.primary_color
      ORDER BY points DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const findAllPlayersWithPeriodPoints = async (periodId: number) => {
  const query = `
    SELECT 
      p.player_id AS id,
      p.first_name || ' ' || p.last_name AS name,
      p.position AS pos,
      p.team_abbrev AS team,
      p.current_price AS salary,
      COALESCE(SUM(pgs.points_earned), 0) AS points,
      rt.primary_color AS color
    FROM players p
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    LEFT JOIN scoring_periods sp ON sp.period_id = $1
    LEFT JOIN real_teams rt ON p.team_abbrev = rt.abbreviation
    WHERE m.scheduled_at::date BETWEEN sp.start_date AND sp.end_date
    GROUP BY 
      p.player_id, p.first_name, p.last_name, 
      p.position, p.team_abbrev, 
      p.current_price, rt.primary_color
    ORDER BY points DESC;
  `;
  const result = await pool.query(query, [periodId]);
  return result.rows;
};

export const getActiveRangeCTE = (scope: "current" | "period") => {
  if (scope === "period") {
    return `
      WITH active_range AS (
        SELECT start_date, end_date
        FROM scoring_periods
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        ORDER BY start_date LIMIT 1
      )`;
  }
  return `
    WITH season_year AS (
      SELECT (EXTRACT(YEAR FROM start_date)::int - CASE WHEN EXTRACT(MONTH FROM start_date) >= 10 THEN 0 ELSE 1 END) AS y
      FROM scoring_periods
      WHERE CURRENT_DATE BETWEEN start_date AND end_date
      ORDER BY start_date LIMIT 1
    ),
    active_range AS (
      SELECT MIN(sp.start_date) AS start_date, MAX(sp.end_date) AS end_date
      FROM scoring_periods sp
      CROSS JOIN season_year sy
      WHERE (EXTRACT(YEAR FROM sp.start_date)::int - CASE WHEN EXTRACT(MONTH FROM sp.start_date) >= 10 THEN 0 ELSE 1 END) = sy.y
    )`;
};

export const getPlayerDetail = async (
  playerId: number,
  scope: "current" | "all" | "period" = "all",
) => {
  let cte = "";
  let dateFilter = "";
  if (scope !== "all") {
    cte = getActiveRangeCTE(scope);
    dateFilter =
      "AND m.scheduled_at::date BETWEEN (SELECT start_date FROM active_range) AND (SELECT end_date FROM active_range)";
  }

  const gameStatsQuery = `
    ${cte}
    SELECT pgs.stat_id, m.scheduled_at AS game_date, m.match_id,
           pgs.points_earned, pgs.goals, pgs.assists, pgs.sog, pgs.blocked_shots,
           pgs.toi_seconds, pgs.saves, pgs.goals_against, pgs.is_win
    FROM player_game_stats pgs
    JOIN matches m ON pgs.match_id = m.match_id
    WHERE pgs.player_id = $1 ${scope !== "all" ? dateFilter : ""}
    ORDER BY m.scheduled_at DESC
  `;

  const periodQuery = `
    ${cte}
    SELECT sp.period_id, sp.period_name, sp.start_date, sp.end_date,
           COALESCE(SUM(pgs.points_earned),0) AS period_points,
           COUNT(pgs.stat_id) AS games_in_period
    FROM scoring_periods sp
    LEFT JOIN matches m ON m.scheduled_at::date BETWEEN sp.start_date AND sp.end_date
    LEFT JOIN player_game_stats pgs ON pgs.player_id = $1 AND pgs.match_id = m.match_id
    ${scope !== "all" ? `WHERE sp.start_date >= (SELECT start_date FROM active_range) AND sp.end_date <= (SELECT end_date FROM active_range)` : ""}
    GROUP BY sp.period_id, sp.period_name, sp.start_date, sp.end_date
    ORDER BY sp.start_date
  `;

  const [playerRow, gameRows, periodRows, priceRows] = await Promise.all([
    pool.query(
      `SELECT player_id AS id, first_name, last_name, position, team_abbrev AS team,
                       base_rating, start_price, current_price, is_injured
                FROM players WHERE player_id = $1`,
      [playerId],
    ),
    pool.query(gameStatsQuery, [playerId]),
    pool.query(periodQuery, [playerId]),
    pool.query(
      `SELECT history_id, recorded_at, price, period_id
         FROM price_history
         WHERE player_id = $1
         ORDER BY recorded_at ASC`,
      [playerId],
    ),
  ]);

  const player = playerRow.rows[0];
  if (!player) return null;

  const games = gameRows.rows;
  const rolling5 = rollingAverage(
    games.map((g: any) => Number(g.points_earned)),
    5,
  );
  const rolling10 = rollingAverage(
    games.map((g: any) => Number(g.points_earned)),
    10,
  );

  return {
    ...player,
    name: `${player.first_name} ${player.last_name}`.trim(),
    game_stats: games.map((g: any, i: number) => ({
      ...g,
      rolling_avg_5: rolling5[i] ?? null,
      rolling_avg_10: rolling10[i] ?? null,
    })),
    period_breakdown: periodRows.rows,
    price_history: priceRows.rows,
    usage: computeUsage(games, player.position),
  };
};

function rollingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) =>
    i < window - 1
      ? null
      : Number(
          (
            values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) /
            window
          ).toFixed(2),
        ),
  );
}

function computeUsage(games: any[], position: string) {
  if (!games.length) return {};
  if (position === "G") {
    const saves = games.map((g) => Number(g.saves ?? 0));
    const ga = games.map((g) => Number(g.goals_against ?? 0));
    const wins = games.filter((g) => g.is_win).length;
    return {
      saves_per_game: (saves.reduce((a, b) => a + b, 0) / saves.length).toFixed(
        1,
      ),
      goals_against_per_game: (
        ga.reduce((a, b) => a + b, 0) / ga.length
      ).toFixed(1),
      win_rate: ((wins / games.length) * 100).toFixed(1),
    };
  }
  const toi = games.map((g) => Number(g.toi_seconds ?? 0));
  const shots = games.map((g) => Number(g.sog ?? 0));
  const blocks = games.map((g) => Number(g.blocked_shots ?? 0));
  return {
    toi_avg_seconds: Math.round(toi.reduce((a, b) => a + b, 0) / toi.length),
    shots_per_game: (shots.reduce((a, b) => a + b, 0) / shots.length).toFixed(
      1,
    ),
    blocked_shots_per_game: (
      blocks.reduce((a, b) => a + b, 0) / blocks.length
    ).toFixed(1),
  };
}