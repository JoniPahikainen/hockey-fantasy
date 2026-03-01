import pool from "../db";

type SeasonAggregateRow = {
  player_id: number;
  position: "G" | "D" | "F";
  games_played: number;
  goals: number;
  assists: number;
  sog: number;
  plus_minus: number;
  power_play_goals: number;
  saves: number;
  goals_against: number;
  wins: number;
};

function numeric(v: unknown): number {
  return v != null ? Number(v) : 0;
}

export async function getSeasonAggregate(
  seasonStartYear: number,
): Promise<SeasonAggregateRow[]> {
  const r = await pool.query(
    `
    SELECT
      p.player_id,
      p.position,
      COUNT(pgs.stat_id) AS games_played,
      COALESCE(SUM(pgs.goals),0) AS goals,
      COALESCE(SUM(pgs.assists),0) AS assists,
      COALESCE(SUM(pgs.sog),0) AS sog,
      COALESCE(SUM(pgs.plus_minus),0) AS plus_minus,
      COALESCE(SUM(pgs.power_play_goals),0) AS power_play_goals,
      COALESCE(SUM(pgs.saves),0) AS saves,
      COALESCE(SUM(pgs.goals_against),0) AS goals_against,
      COALESCE(SUM(CASE WHEN pgs.is_win THEN 1 ELSE 0 END),0) AS wins
    FROM players p
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    WHERE (EXTRACT(YEAR FROM m.scheduled_at)::int -
      CASE WHEN EXTRACT(MONTH FROM m.scheduled_at) >= 10 THEN 0 ELSE 1 END
    ) = $1
    GROUP BY p.player_id, p.position
  `,
    [seasonStartYear],
  );

  return r.rows.map(
    (row: {
      player_id: unknown;
      position: any;
      games_played: unknown;
      goals: unknown;
      assists: unknown;
      sog: unknown;
      plus_minus: unknown;
      power_play_goals: unknown;
      saves: unknown;
      goals_against: unknown;
      wins: unknown;
    }) => ({
      player_id: numeric(row.player_id),
      position: row.position,
      games_played: numeric(row.games_played),
      goals: numeric(row.goals),
      assists: numeric(row.assists),
      sog: numeric(row.sog),
      plus_minus: numeric(row.plus_minus),
      power_play_goals: numeric(row.power_play_goals),
      saves: numeric(row.saves),
      goals_against: numeric(row.goals_against),
      wins: numeric(row.wins),
    }),
  );
}

function computeSeasonRatings(rows: SeasonAggregateRow[]) {
  const byPosition = new Map<"G" | "D" | "F", SeasonAggregateRow[]>();

  for (const r of rows) {
    if (!byPosition.has(r.position)) {
      byPosition.set(r.position, []);
    }
    byPosition.get(r.position)!.push(r);
  }

  const result = new Map<number, { rating: number; games: number }>();

  for (const [position, list] of byPosition.entries()) {
    let scores: number[] = [];

    if (position === "G") {
      scores = list.map((r) => {
        const totalShots = r.saves + r.goals_against;
        const savePct = totalShots > 0 ? r.saves / totalShots : 0.9;

        return savePct * 100 + r.wins * 2 - r.goals_against * 0.5;
      });
    }

    if (position === "D") {
      scores = list.map(
        (r) =>
          r.goals * 3 +
          r.assists * 3 +
          r.sog * 0.2 +
          r.plus_minus * 0.7 +
          r.power_play_goals * 1.2,
      );
    }

    if (position === "F") {
      scores = list.map(
        (r) =>
          r.goals * 4 +
          r.assists * 3 +
          r.sog * 0.2 +
          r.plus_minus * 0.5 +
          r.power_play_goals * 1.5,
      );
    }

    const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);

    const variance =
      scores.reduce((acc, s) => acc + (s - avg) ** 2, 0) / (scores.length || 1);

    const stdDev = Math.sqrt(variance) || 1;

    list.forEach((r, i) => {
      const score = scores[i] ?? 0;

      const raw = 50 + ((score - avg) / stdDev) * 10;

      const rating = Math.max(40, Math.min(95, raw));

      result.set(r.player_id, {
        rating: Math.round(rating * 100) / 100,
        games: r.games_played,
      });
    });
  }

  return result;
}

export async function recalculateBaseRatings(): Promise<void> {
  const seasonQuery = await pool.query(`
    SELECT (EXTRACT(YEAR FROM CURRENT_DATE)::int -
      CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 10 THEN 0 ELSE 1 END
    ) AS current_season
  `);

  const currentSeason = seasonQuery.rows[0].current_season;
  const lastSeason = currentSeason - 1;

  const [currentRows, lastRows] = await Promise.all([
    getSeasonAggregate(currentSeason),
    getSeasonAggregate(lastSeason),
  ]);

  const currentRatings = computeSeasonRatings(currentRows);
  const lastRatings = computeSeasonRatings(lastRows);

  const playersRes = await pool.query(
    "SELECT player_id, base_rating FROM players",
  );

  const stabilization = 30;

  for (const player of playersRes.rows) {
    const playerId = numeric(player.player_id);
    const storedBase = numeric(player.base_rating) || 70;

    const current = currentRatings.get(playerId);
    const last = lastRatings.get(playerId);

    const gamesCurrent = current?.games ?? 0;

    const weightCurrent = gamesCurrent / (gamesCurrent + stabilization);

    const weightLast = 1 - weightCurrent;

    const R_current = current?.rating ?? storedBase;
    const R_last = last?.rating ?? storedBase;

    const finalRating = weightCurrent * R_current + weightLast * R_last;

    await pool.query(
      `UPDATE players 
       SET base_rating = ROUND($1::numeric,2)
       WHERE player_id = $2`,
      [finalRating, playerId],
    );
  }
}
