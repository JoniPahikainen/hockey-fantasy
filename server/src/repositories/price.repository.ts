import pool from "../db";


export const getPlayersForPricing = async () => {
  const r = await pool.query(
    `SELECT player_id, position, COALESCE(base_rating, 0)::float AS base_rating
       FROM players`,
  );
  const rows = r.rows as {
    player_id: number;
    position: string;
    base_rating: number;
  }[];
  return rows.map((p) => ({
    player_id: p.player_id,
    position: p.position as "G" | "D" | "F",
    base_rating: Number(p.base_rating),
  }));
};

export const updateStartPrices = async (
  priced: { player_id: number; start_price: number }[],
) => {
  for (const { player_id, start_price } of priced) {
    await pool.query(
      "UPDATE players SET start_price = $1 WHERE player_id = $2",
      [start_price, player_id],
    );
  }
};

export const resetSeasonPrices = async () => {
  await pool.query("UPDATE players SET current_price = start_price");
};

export const getCurrentPeriodId = async () => {
  const r = await pool.query(
    `SELECT period_id FROM scoring_periods
       WHERE CURRENT_DATE BETWEEN start_date AND end_date
       ORDER BY start_date LIMIT 1`,
  );
  return r.rows[0]?.period_id ?? null;
};

const PRICE_CHANGE_PER_POINT = 1000;
const MAX_DAILY_PRICE_CHANGE = 250_000;
const MIN_CURRENT_PRICE = 50_000;

function toYmd(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return String(d);
}

function buildDeltaMap(
  rows: { player_id: number; total_pts: string | number | null }[],
): Map<number, number> {
  const deltaMap = new Map<number, number>();
  for (const row of rows) {
    const raw = Math.round(Number(row.total_pts || 0) * PRICE_CHANGE_PER_POINT);
    const cappedDaily = Math.max(
      -MAX_DAILY_PRICE_CHANGE,
      Math.min(MAX_DAILY_PRICE_CHANGE, raw),
    );
    deltaMap.set(row.player_id, cappedDaily);
  }
  return deltaMap;
}

function applyPriceChange(
  base: number,
  delta: number,
  growthCap: number,
  dropCap: number,
): number {
  let d = delta;
  const maxUp = base * growthCap;
  const maxDown = base * dropCap;
  d = Math.min(d, maxUp);
  d = Math.max(d, -maxDown);
  let newPrice = Math.round(base + d);
  newPrice = Math.max(MIN_CURRENT_PRICE, newPrice);
  return newPrice;
}

export const upsertPriceHistory = async (
  client: any,
  playerId: number,
  price: number,
  periodId: number | null,
  priceDateYmd: string,
) => {
  const args = [playerId, price, periodId, priceDateYmd];
  const updateQ = `
UPDATE price_history
SET
  price = $2,
  period_id = $3,
  recorded_at = ($4::date + time '12:00:00')::timestamp,
  price_date = $4::date
WHERE player_id = $1
  AND price_date = $4::date`;
  const insertQ = `
INSERT INTO price_history (player_id, price, period_id, recorded_at, price_date)
SELECT $1, $2, $3, ($4::date + time '12:00:00')::timestamp, $4::date
WHERE NOT EXISTS (
  SELECT 1
  FROM price_history
  WHERE player_id = $1
    AND price_date = $4::date
)`;
  if (client) {
    await client.query(updateQ, args);
    await client.query(insertQ, args);
  } else {
    await pool.query(updateQ, args);
    await pool.query(insertQ, args);
  }
};

export const shouldSkipDailyRebuildToday = async (): Promise<boolean> => {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM players) AS player_count,
      (SELECT COUNT(DISTINCT player_id)::int FROM price_history WHERE price_date = CURRENT_DATE) AS dated_today
  `);
  const row = r.rows[0] as { player_count: number; dated_today: number };
  const pc = Number(row.player_count);
  const dt = Number(row.dated_today);
  if (pc === 0) return true;
  return dt === pc;
};

export const rebuildDailyPriceHistoryForCurrentPeriod = async (
  growthCap: number,
  dropCap: number,
) => {
  const periodRow = await pool.query(
    `SELECT period_id, start_date, end_date
       FROM scoring_periods
       WHERE CURRENT_DATE BETWEEN start_date AND end_date
       ORDER BY start_date LIMIT 1`,
  );

  const period = periodRow.rows[0] as
    | { period_id: number; start_date: unknown; end_date: unknown }
    | undefined;
  if (!period) return;

  const pid = period.period_id;

  const rangeRow = await pool.query(
    `SELECT LEAST($1::date, CURRENT_DATE)::date AS last_day`,
    [period.end_date],
  );
  const lastDay = rangeRow.rows[0].last_day;

  const daysRes = await pool.query(
    `SELECT d::date AS day
       FROM generate_series($1::date, $2::date, '1 day'::interval) d
       ORDER BY day`,
    [period.start_date, lastDay],
  );

  const playersRes = await pool.query(
    "SELECT player_id, start_price FROM players",
  );

  const state = new Map<number, number>();
  for (const p of playersRes.rows) {
    state.set(p.player_id, Number(p.start_price));
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const dr of daysRes.rows) {
      const dayStr = toYmd(dr.day);
      const ptsRes = await client.query(
        `SELECT pgs.player_id,
                SUM(pgs.points_earned)::float AS total_pts
         FROM player_game_stats pgs
         JOIN matches m ON m.match_id = pgs.match_id
         WHERE m.scheduled_at::date = $1::date
         GROUP BY pgs.player_id`,
        [dayStr],
      );

      const deltaMap = buildDeltaMap(ptsRes.rows);

      for (const [playerId, base] of state) {
        const rawDelta = deltaMap.get(playerId) ?? 0;
        const newPrice = applyPriceChange(base, rawDelta, growthCap, dropCap);
        state.set(playerId, newPrice);
        await upsertPriceHistory(client, playerId, newPrice, pid, dayStr);
      }
    }

    for (const [playerId, price] of state) {
      await client.query(
        `UPDATE players SET current_price = $1 WHERE player_id = $2`,
        [price, playerId],
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
