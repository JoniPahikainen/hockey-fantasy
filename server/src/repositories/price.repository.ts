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

export const insertPriceHistory = async (
  playerId: number,
  price: number,
  periodId?: number,
) => {
  await pool.query(
    `INSERT INTO price_history (player_id, price, period_id) VALUES ($1, $2, $3)`,
    [playerId, price, periodId ?? null],
  );
};

const PRICE_CHANGE_PER_POINT = 1000;
const MAX_DAILY_PRICE_CHANGE = 250_000;
const MIN_CURRENT_PRICE = 50_000;

export const processPeriodPriceUpdate = async (
  growthCap: number,
  dropCap: number,
  periodId: number | null,
) => {
  const periodRow = await pool.query(
    `SELECT period_id, start_date, end_date
       FROM scoring_periods
       WHERE CURRENT_DATE BETWEEN start_date AND end_date
       ORDER BY start_date LIMIT 1`,
  );

  const period = periodRow.rows[0];
  if (!period) return;

  const pid = period.period_id ?? periodId;

  const players = await pool.query(
    "SELECT player_id, current_price FROM players",
  );

  const points = await pool.query(
    `SELECT pgs.player_id,
              SUM(pgs.points_earned)::float AS total_pts
       FROM player_game_stats pgs
       JOIN matches m ON m.match_id = pgs.match_id
       WHERE m.scheduled_at::date BETWEEN $1 AND $2
       GROUP BY pgs.player_id`,
    [period.start_date, period.end_date],
  );

  const deltaMap = new Map<number, number>();

  for (const row of points.rows) {
    const raw = Math.round(Number(row.total_pts || 0) * PRICE_CHANGE_PER_POINT);

    const cappedDaily = Math.max(
      -MAX_DAILY_PRICE_CHANGE,
      Math.min(MAX_DAILY_PRICE_CHANGE, raw),
    );

    deltaMap.set(row.player_id, cappedDaily);
  }

  for (const p of players.rows) {
    const base = Number(p.current_price);
    let delta = deltaMap.get(p.player_id) ?? 0;

    const maxUp = base * growthCap;
    const maxDown = base * dropCap;

    delta = Math.min(delta, maxUp);
    delta = Math.max(delta, -maxDown);

    let newPrice = Math.round(base + delta);
    newPrice = Math.max(MIN_CURRENT_PRICE, newPrice);

    await pool.query(
      `UPDATE players SET current_price = $1
         WHERE player_id = $2`,
      [newPrice, p.player_id],
    );

    await insertPriceHistory(p.player_id, newPrice, pid);
  }
};
