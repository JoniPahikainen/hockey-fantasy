import pool from "../db";
import * as nhlPlayerRepo from "../repositories/nhlPlayer.repository";


export const findAllPlayersForMarket = async (
  scope: "current" | "all" | "period" = "all",
) => {
  let rangeJoin = "";
  let cte = "";
  if (scope !== "all") {
    cte = nhlPlayerRepo.getActiveRangeCTE(scope);
    rangeJoin =
      "AND m.scheduled_at::date BETWEEN (SELECT start_date FROM active_range) AND (SELECT end_date FROM active_range)";
  }

  const result = await pool.query(`
    ${cte}
    SELECT
      p.player_id AS id,
      p.first_name || ' ' || p.last_name AS name,
      p.position,
      p.team_abbrev AS team,
      p.base_rating,
      p.start_price,
      p.current_price,
      p.is_injured,
      COALESCE(SUM(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.points_earned ELSE 0 END), 0) AS season_total_fantasy_points,
      COUNT(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.stat_id END) AS games_played,
      CASE WHEN COUNT(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.stat_id END) > 0
           THEN ROUND((SUM(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.points_earned ELSE 0 END)::numeric /
                       COUNT(CASE WHEN m.match_id IS NOT NULL ${scope !== "all" ? rangeJoin : ""} THEN pgs.stat_id END)), 2)
           ELSE 0
      END AS avg_points_per_game
    FROM players p
    LEFT JOIN player_game_stats pgs ON p.player_id = pgs.player_id
    LEFT JOIN matches m ON pgs.match_id = m.match_id
    GROUP BY p.player_id, p.first_name, p.last_name, p.position, p.team_abbrev, p.base_rating, p.start_price, p.current_price, p.is_injured
    ORDER BY p.position, p.last_name
  `);
  return result.rows;
};


export const updatePlayerMarketFields = async (
  playerId: number,
  updates: { base_rating?: number; start_price?: number; is_injured?: boolean },
) => {
  const set: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (updates.base_rating !== undefined) {
    set.push(`base_rating=$${i++}`);
    values.push(updates.base_rating);
  }
  if (updates.start_price !== undefined) {
    set.push(`start_price=$${i++}`);
    values.push(updates.start_price);
  }
  if (updates.is_injured !== undefined) {
    set.push(`is_injured=$${i++}`);
    values.push(updates.is_injured);
  }
  if (!set.length) return null;
  values.push(playerId);
  const r = await pool.query(
    `UPDATE players SET ${set.join(", ")} WHERE player_id=$${i} RETURNING *`,
    values,
  );
  return r.rows[0];
};

export const getPlayerBeforeUpdate = async (playerId: number) => {
  const r = await pool.query(
    `SELECT base_rating, start_price, is_injured FROM players WHERE player_id=$1`,
    [playerId],
  );
  return r.rows[0];
};

export const getScoringRules = async () => {
  const [rules, saveTiers, gaTiers] = await Promise.all([
    pool.query(`SELECT rule_key, goalie, defense, forward FROM scoring_rules ORDER BY rule_key`),
    pool.query(`SELECT min_saves, max_saves, points FROM goalie_save_points ORDER BY min_saves`),
    pool.query(`SELECT goals_against, points FROM goalie_goals_against_penalty ORDER BY goals_against`),
  ]);
  return {
    rules: rules.rows,
    goalie_save_tiers: saveTiers.rows,
    goalie_goals_against: gaTiers.rows,
  };
};
