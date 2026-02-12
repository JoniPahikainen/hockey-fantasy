import * as repo from "../repositories/match.repository";

export const getMatchesByDate = async (date: string) => {
  const startRange = `${date} 12:00:00`;

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split("T")[0];
  const endRange = `${tomorrowString} 11:59:59`;

  return await repo.findMatchesInTimeRange(startRange, endRange);
};