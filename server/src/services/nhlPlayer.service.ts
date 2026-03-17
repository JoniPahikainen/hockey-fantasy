import * as repo from "../repositories/nhlPlayer.repository";
import * as priceRepo from "../repositories/price.repository";

export const getPlayerPool = async () => {
  return await repo.findAllPlayersWithStats();
};

export const getPlayerPoolWithPeriodPoints = async () => {
  const periodId = await priceRepo.getCurrentPeriodId();
  return await repo.findAllPlayersWithPeriodPoints(periodId);
};

export const getPlayerDetail = (
  playerId: number,
  scope?: "current" | "all" | "period",
) => repo.getPlayerDetail(playerId, scope ?? "all");