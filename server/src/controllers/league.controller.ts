import { Request, Response } from "express";
import * as service from "../services/league.service";
import { ServiceError } from "../utils/errors";

// Create a new private league
export const createLeague = async (req: Request, res: Response) => {
  try {
    const { name, passcode, creator_id } = req.body;
    if (!name || !passcode || !creator_id) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }
    const league = await service.createLeague(name, passcode, creator_id);
    return res.json({ ok: true, league });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error creating league:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Join a league using a passcode
export const joinLeague = async (req: Request, res: Response) => {
  try {
    const { team_id, league_id, passcode } = req.body;
    if (!team_id || !league_id || !passcode) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }
    await service.joinLeague(team_id, league_id, passcode);
    return res.json({ ok: true, message: "Successfully joined league" });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error joining league:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Leave a league
export const leaveLeague = async (req: Request, res: Response) => {
  try {
    const { league_id } = req.params;
    const { team_id } = req.body;
    if (!league_id || !team_id) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }
    await service.leaveLeague(Number(league_id), Number(team_id));
    return res.json({ ok: true, message: "Successfully left league" });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error leaving league:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get full season standings for a league
export const getLeagueStandings = async (req: Request, res: Response) => {
  try {
    const { league_id } = req.params;
    if (!league_id) {
      return res
        .status(400)
        .json({ ok: false, error: "League ID is required" });
    }
    const standings = await service.getLeagueStandings(Number(league_id));
    return res.json({ ok: true, standings });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching league standings:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get standings for a league filtered by a specific scoring period
export const getLeagueStandingsByPeriod = async (
  req: Request,
  res: Response,
) => {
  try {
    const { league_id, period_id } = req.params;
    if (!league_id || !period_id) {
      return res
        .status(400)
        .json({ ok: false, error: "League ID and Period ID are required" });
    }

    const periodIdNum = Number(period_id);
    if (!Number.isInteger(periodIdNum)) {
      return res.status(400).json({ ok: false, error: "Invalid Period ID" });
    }

    const current = await service.getCurrentPeriod();
    const isCurrentPeriod = Number(current.period_id) === periodIdNum;

    const standings = await service.getLeagueStandingsByPeriod(
      Number(league_id),
      periodIdNum,
    );

    return res.json({ ok: true, standings, is_current_period: isCurrentPeriod });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching league standings by period:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};


// Get leagues by user ID
export const getLeaguesByUserId = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ ok: false, error: "User ID is required" });
    }
    const leagues = await service.getLeaguesByUserId(Number(user_id));
    return res.json({ ok: true, leagues });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching leagues by user ID:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get current period
export const getCurrentPeriod = async (req: Request, res: Response) => {
  try {
    const period = await service.getCurrentPeriod();
    return res.json({ ok: true, period });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching current period:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get daily team performance for graphing
export const getDailyTeamPerformance = async (req: Request, res: Response) => {
  try {
    const { team_id, period_id } = req.params;
    if (!team_id || !period_id) {
      return res
        .status(400)
        .json({ ok: false, error: "Team ID and Period ID are required" });
    }
    const performance = await service.getDailyTeamPerformance(
      Number(team_id),
      Number(period_id),
    );
    return res.json({ ok: true, performance });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching daily team performance:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

// Get daily player breakdown (players and points for one day)
export const getDailyPlayerBreakdown = async (req: Request, res: Response) => {
  try {
    const { team_id, date } = req.params;
    if (!team_id || !date) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "Team ID and date (YYYY-MM-DD) are required",
        });
    }
    const breakdown = await service.getDailyPlayerBreakdown(
      Number(team_id),
      date,
    );
    return res.json({ ok: true, breakdown });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching daily player breakdown:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const getLeagueRecords = async (req: Request, res: Response) => {
  try {
    const { league_id } = req.params;
    const periodIdRaw = req.query.period_id as string | undefined;
    if (!league_id) {
      return res
        .status(400)
        .json({ ok: false, error: "League ID is required" });
    }

    const periodId = periodIdRaw ? Number(periodIdRaw) : null;
    if (periodIdRaw && !Number.isInteger(periodId)) {
      return res.status(400).json({ ok: false, error: "Invalid period_id" });
    }

    const rows = await service.getLeagueRecords(Number(league_id), periodId);
    return res.json({ ok: true, records: rows });
  } catch (err) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    console.error("Error fetching league records:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};