import bcrypt from "bcrypt";
import * as repo from "../repositories/league.repository";
import { getDailyTeamPerformance as fetchTeamPerformance } from "../repositories/fantasyTeam.repository";
import { ServiceError } from "../utils/errors";

export const createLeague = async (
  name: string,
  passcode: string,
  creator_id: number,
) => {
    const passwordHash = await bcrypt.hash(passcode, 10);
    const result = await repo.insertLeague(name, passwordHash, creator_id);
    return result.rows[0];
};

export const joinLeague = async (
  team_id: number,
  league_id: number,
  passcode: string,
) => {
    const leagueCheck = await repo.getPasscode(league_id);
    if (leagueCheck.rowCount === 0) {
        throw new ServiceError("League not found", 404);
    }
    const isMatch = await bcrypt.compare(passcode, leagueCheck.rows[0].passcode);
    if (!isMatch) {
        throw new ServiceError("Invalid passcode", 401);
    }
    await repo.addMember(league_id, team_id);
    return true;
};

export const leaveLeague = async (
  league_id: number,
  team_id: number,
) => {
    const leagueCheck = await repo.getPasscode(league_id);
    if (leagueCheck.rowCount === 0) {
        throw new ServiceError("League not found", 404);
    }
    
    // Get the creator_id and team's user_id
    const creatorResult = await repo.getLeagueCreator(league_id);
    const teamUserResult = await repo.getTeamUserId(team_id);
    
    if (teamUserResult.rowCount === 0) {
        throw new ServiceError("Team not found", 404);
    }
    
    const creator_id = creatorResult.rows[0].creator_id;
    const user_id = teamUserResult.rows[0].user_id;
    
    // If user is the creator, delete the entire league
    if (user_id === creator_id) {
        await repo.deleteLeague(league_id);
    } else {
        // Otherwise just remove them from the league
        await repo.removeMember(league_id, team_id);
    }
    
    return true;
};

export const getLeagueStandings = async (league_id: number) => {
    const result = await repo.getFullStandings(league_id);
    return result.rows;
}

export const getLeagueStandingsByPeriod = async (
  league_id: number,
  period_id: number,
) => {
    const result = await repo.getLeagueStandingsByPeriod(league_id, period_id);
    return result.rows;
};

export const getCurrentPeriodStandings = async (league_id: number) => {
    const result = await repo.getCurrentPeriodStandings(league_id);
    return result.rows;
};

export const getStandingsWithLastNight = async (league_id: number) => {
    const result = await repo.getStandingsWithLastNight(league_id);
    return result.rows;
};

export const getLeaguesByUserId = async (user_id: number) => {
    const result = await repo.getLeaguesByUserId(user_id);
    return result.rows;
};

export const getCurrentPeriod = async () => {
    const result = await repo.getCurrentPeriod();
    if (result.rowCount === 0) {
        throw new ServiceError("No active period found", 404);
    }
    return result.rows[0];
};

export const getDailyTeamPerformance = async (
  team_id: number,
  period_id: number,
) => {
    const result = await fetchTeamPerformance(team_id, period_id);
    return result.rows;
};