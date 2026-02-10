import * as repo from "../repositories/nhlPlayer.repository";

export const getPlayerPool = async () => {
  return await repo.findAllPlayersWithStats();
};