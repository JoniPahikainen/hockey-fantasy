import * as repo from "../repositories/price.repository";
import {
  PricingStructure,
  PlayerForPricing,
  PricedPlayer,
  PlayerWithNormalized,
} from "../types/price.type";

export const regenerateStartPrices = async (userId: number) => {
  const players = await repo.getPlayersForPricing();
  const structure = structureFromConfig();
  const priced = runStartPricePipeline(players, structure);
  const valid = validatePricing(
    priced,
    structure.floorGoalie,
    structure.floorSkater,
    structure.budget,
  );
  if (!valid) {
    console.warn(
      "[regenerateStartPrices] Validation failed: 3 highest + 3 min slots ≤ budget; stacking 3 elites may be possible.",
    );
  }
  await repo.updateStartPrices(priced);
};

export const resetSeasonPrices = async (userId: number) => {
  await repo.resetSeasonPrices();
};

export const processPeriodPriceUpdate = async (_userId: number) => {
  await repo.rebuildDailyPriceHistoryForCurrentPeriod(0.15, 0.1);
};

export const processPeriodPriceUpdateForSeed = async (_userId: number) => {
  const skip = await repo.shouldSkipDailyRebuildToday();
  if (skip) return { skipped: true as const };
  await repo.rebuildDailyPriceHistoryForCurrentPeriod(0.15, 0.1);
  return { skipped: false as const };
};

const DEFAULT_STRUCTURE: PricingStructure = {
  budget: 10_000_000,
  rosterSlots: 6,
  floorGoalie: 1_400_000,
  floorSkater: 1_000_000,
  ceilingGoalie: 2_200_000,
  ceilingSkater: 3_200_000,
  eliteTwoSumMin: 5_500_000,
  eliteTwoSumMax: 6_500_000,
  alphaMin: 1.8,
  alphaMax: 2.2,
};

export function structureFromConfig(): PricingStructure {
  return {
    budget: DEFAULT_STRUCTURE.budget,
    rosterSlots: DEFAULT_STRUCTURE.rosterSlots,
    floorGoalie: DEFAULT_STRUCTURE.floorGoalie,
    floorSkater: DEFAULT_STRUCTURE.floorSkater,
    ceilingGoalie: DEFAULT_STRUCTURE.ceilingGoalie,
    ceilingSkater: DEFAULT_STRUCTURE.ceilingSkater,
    eliteTwoSumMin: DEFAULT_STRUCTURE.eliteTwoSumMin,
    eliteTwoSumMax: DEFAULT_STRUCTURE.eliteTwoSumMax,
    alphaMin: DEFAULT_STRUCTURE.alphaMin,
    alphaMax: DEFAULT_STRUCTURE.alphaMax,
  };
}

function computeScores(
  players: PlayerForPricing[],
): (PlayerForPricing & { score: number })[] {
  return players.map((p) => ({
    ...p,
    score: p.score ?? p.base_rating,
  }));
}

function normalizePerPosition(
  players: (PlayerForPricing & { score: number })[],
): PlayerWithNormalized[] {
  const byPos = {
    G: [] as (PlayerForPricing & { score: number })[],
    D: [] as (PlayerForPricing & { score: number })[],
    F: [] as (PlayerForPricing & { score: number })[],
  };
  for (const p of players) {
    const pos = p.position as "G" | "D" | "F";
    if (byPos[pos]) byPos[pos].push(p);
  }
  const out: PlayerWithNormalized[] = [];
  for (const pos of ["G", "D", "F"] as const) {
    const list = byPos[pos];
    if (list.length === 0) continue;
    const scores = list.map((x) => x.score);
    const minS = Math.min(...scores);
    const maxS = Math.max(...scores);
    const span = maxS - minS || 1;
    for (const p of list) {
      out.push({
        ...p,
        score: p.score,
        normalized: (p.score - minS) / span,
      });
    }
  }
  return out;
}

function priceFromCurve(
  normalized: number,
  floor: number,
  ceiling: number,
  alpha: number,
): number {
  const term = Math.pow(normalized, alpha);
  return Math.round(floor + term * (ceiling - floor));
}

function computePrices(
  players: PlayerWithNormalized[],
  structure: PricingStructure,
  alpha: number,
): PricedPlayer[] {
  return players.map((p) => {
    const floor =
      p.position === "G" ? structure.floorGoalie : structure.floorSkater;
    const ceiling =
      p.position === "G" ? structure.ceilingGoalie : structure.ceilingSkater;
    const start_price = priceFromCurve(p.normalized, floor, ceiling, alpha);
    return {
      player_id: p.player_id,
      start_price: Math.max(start_price, floor),
    };
  });
}

function topTwoSum(priced: PricedPlayer[]): number {
  const sorted = [...priced].sort((a, b) => b.start_price - a.start_price);
  return (sorted[0]?.start_price ?? 0) + (sorted[1]?.start_price ?? 0);
}

function calibrateAlpha(
  players: PlayerWithNormalized[],
  structure: PricingStructure,
): number {
  let lo = structure.alphaMin;
  let hi = structure.alphaMax;
  const targetMin = structure.eliteTwoSumMin;
  const targetMax = structure.eliteTwoSumMax;
  let bestAlpha = (lo + hi) / 2;
  for (let i = 0; i < 40; i++) {
    const alpha = (lo + hi) / 2;
    const priced = computePrices(players, structure, alpha);
    const sum = topTwoSum(priced);
    if (sum >= targetMin && sum <= targetMax) return alpha;
    if (sum < targetMin) hi = alpha;
    else lo = alpha;
    bestAlpha = alpha;
  }
  return bestAlpha;
}

export function validatePricing(
  priced: PricedPlayer[],
  floorGoalie: number,
  floorSkater: number,
  budget: number,
): boolean {
  const sorted = [...priced].sort((a, b) => b.start_price - a.start_price);
  const top3 =
    (sorted[0]?.start_price ?? 0) +
    (sorted[1]?.start_price ?? 0) +
    (sorted[2]?.start_price ?? 0);
  const minThreeSlots = floorGoalie + 2 * floorSkater;
  return top3 + minThreeSlots > budget;
}

export function runStartPricePipeline(
  players: PlayerForPricing[],
  structure: PricingStructure,
): PricedPlayer[] {
  if (players.length === 0) return [];
  const withScores = computeScores(players);
  const withNormalized = normalizePerPosition(withScores);
  const alpha = calibrateAlpha(withNormalized, structure);
  return computePrices(withNormalized, structure, alpha);
}
