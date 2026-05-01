import { Request, Response } from "express";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { year: number; data: unknown; fetchedAt: number } | null = null;

function getCurrentPlayoffYear(): number {

  const now = new Date();
  const month = now.getUTCMonth(); // 0-based
  return month >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

export const getPlayoffBracket = async (_req: Request, res: Response) => {
  try {
    const year = getCurrentPlayoffYear();

    if (cache && cache.year === year && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return res.json({ ok: true, year, bracket: cache.data });
    }

    const response = await fetch(
      `https://api-web.nhle.com/v1/playoff-bracket/${year}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.json({ ok: true, year, bracket: null });
      }
      return res
        .status(502)
        .json({ ok: false, error: `NHL API error: ${response.status}` });
    }

    const data = await response.json();
    cache = { year, data, fetchedAt: Date.now() };
    return res.json({ ok: true, year, bracket: data });
  } catch (err) {
    console.error("Error fetching playoff bracket:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};
