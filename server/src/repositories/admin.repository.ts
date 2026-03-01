import pool from "../db";

const getActiveRangeCTE = (scope: "current" | "period") => {
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

export const findAllPlayersForMarket = async (
  scope: "current" | "all" | "period" = "all",
) => {
  let rangeJoin = "";
  let cte = "";
  if (scope !== "all") {
    cte = getActiveRangeCTE(scope);
    rangeJoin =
      "AND m.scheduled_at::date BETWEEN (SELECT start_date FROM active_range) AND (SELECT end_date FROM active_range)";
  }

  const result = await pool.query(`
    ${cte}
    SELECT
      p.player_id AS id,
      p.first_name || ' ' || p.last_name AS name,
      p.position,
      p.team_abbrev AS team,
      p.base_rating,
      p.start_price,
      p.current_price,
      p.is_injured,
      COALESCE(SUM(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.points_earned ELSE 0 END), 0) AS season_total_fantasy_points,
      COUNT(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.stat_id END) AS games_played,
      CASE WHEN COUNT(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.stat_id END) > 0
           THEN ROUND((SUM(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.points_earned ELSE 0 END)::numeric /
                       COUNT(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.stat_id END)), 2)
           ELSE 0
      END AS avg_points_per_game
    FROM players p
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    GROUP BY p.player_id, p.first_name, p.last_name, p.position, p.team_abbrev, p.base_rating, p.start_price, p.current_price, p.is_injured
    ORDER BY p.position, p.last_name
  `);
  return result.rows;
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
      `SELECT history_id, recorded_at, price, period_id FROM price_history WHERE player_id = $1 ORDER BY recorded_at ASC`,
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

export const updatePlayerMarketFields = async (
  playerId: number,
  updates: { base_rating?: number; start_price?: number; is_injured?: boolean },
) => {
  const set: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (updates.base_rating !== undefined) {
    set.push(`base_rating=$${i++}`);
    values.push(updates.base_rating);
  }
  if (updates.start_price !== undefined) {
    set.push(`start_price=$${i++}`);
    values.push(updates.start_price);
  }
  if (updates.is_injured !== undefined) {
    set.push(`is_injured=$${i++}`);
    values.push(updates.is_injured);
  }
  if (!set.length) return null;
  values.push(playerId);
  const r = await pool.query(
    `UPDATE players SET ${set.join(", ")} WHERE player_id=$${i} RETURNING *`,
    values,
  );
  return r.rows[0];
};

export const getPlayerBeforeUpdate = async (playerId: number) => {
  const r = await pool.query(
    `SELECT base_rating, start_price, is_injured FROM players WHERE player_id=$1`,
    [playerId],
  );
  return r.rows[0];
};
