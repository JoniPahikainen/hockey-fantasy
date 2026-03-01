import * as repo from "../repositories/rating.repository";

export async function recalculateBaseRatings(): Promise<void> {
  await repo.recalculateBaseRatings();
}

export async function getCurrentSeasonYear(): Promise<number> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  return month >= 10 ? year : year - 1;
}

export async function previewSeasonAggregation(season: number) {
  return repo.getSeasonAggregate(season);
}
