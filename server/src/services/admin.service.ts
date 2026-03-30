import * as repo from "../repositories/admin.repository";
import * as fantasyTeamService from "./fantasyTeam.service";

export const getMarketOverview = (scope?: "current" | "all" | "period") =>
  repo.findAllPlayersForMarket(scope ?? "all");


export const updatePlayerMarket = async (
  userId: number,
  playerId: number,
  updates: { base_rating?: number; start_price?: number; is_injured?: boolean },
) => {
  const before = await repo.getPlayerBeforeUpdate(playerId);
  if (!before) return null;

  const updated = await repo.updatePlayerMarketFields(playerId, updates);
  if (!updated) return null;

  const fields = ["base_rating", "start_price", "is_injured"] as const;
  for (const field of fields) {
    const newVal = (updates as any)[field];
    if (newVal === undefined) continue;
    const prev = (before as any)[field];
  }
  return updated;
};

export const getScoringRules = () => repo.getScoringRules();

export const getTradeLockStatus = () => fantasyTeamService.getTradeLockStatus();

export const lockTrading = () => fantasyTeamService.setTradeLockState(true);

export const openTrading = () => fantasyTeamService.setTradeLockState(false);