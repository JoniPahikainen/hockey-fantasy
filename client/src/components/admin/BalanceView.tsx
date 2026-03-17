import { useEffect, useState, useMemo } from "react";
import api from "../../lib/api";

interface PlayerRow {
  id: number;
  position: string;
  start_price: number;
  current_price: number;
  season_total_fantasy_points: string;
  games_played: string;
  avg_points_per_game: string;
}

interface PositionStats {
  position: string;
  label: string;
  rosterSlots: number;
  count: number;
  totalPoints: number;
  avgPoints: number;
  avgPrice: number;
  avgStartPrice: number;
  pointsPerSlot: number;
  valuePer1M: number;
}

interface ScoringRule {
  rule_key: string;
  goalie: number;
  defense: number;
  forward: number;
}

const POS_LABELS: Record<string, string> = { F: "Forwards", D: "Defense", G: "Goalies" };
const ROSTER_SLOTS: Record<string, number> = { F: 3, D: 2, G: 1 };

const TOP_N_OPTIONS = [
  { value: "all", label: "All" },
  { value: "10", label: "Top 10" },
  { value: "25", label: "Top 25" },
  { value: "50", label: "Top 50" },
  { value: "100", label: "Top 100" },
  { value: "200", label: "Top 200" },
];

const MIN_GAMES_OPTIONS = [
  { value: "all", label: "All" },
  { value: "1", label: "1+" },
  { value: "5", label: "5+" },
  { value: "10", label: "10+" },
  { value: "20", label: "20+" },
];

const MAX_GAMES_OPTIONS = [
  { value: "all", label: "All" },
  { value: "5", label: "5 or fewer" },
  { value: "10", label: "10 or fewer" },
  { value: "20", label: "20 or fewer" },
];

const PRICE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "500000", label: "$0.5M" },
  { value: "1000000", label: "$1M" },
  { value: "1500000", label: "$1.5M" },
  { value: "2000000", label: "$2M" },
  { value: "2500000", label: "$2.5M" },
  { value: "3200000", label: "$3.2M" },
];

export default function BalanceView() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [rules, setRules] = useState<{ rules: ScoringRule[]; goalie_save_tiers: any[]; goalie_goals_against: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"all" | "period" | "current">("all");
  const [topN, setTopN] = useState<string>("all");
  const [topNBy, setTopNBy] = useState<"points" | "price">("points");
  const [minGames, setMinGames] = useState<string>("all");
  const [maxGames, setMaxGames] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/admin/players", { params: { season: scope } }),
      api.get("/admin/scoring-rules"),
    ])
      .then(([playersRes, rulesRes]) => {
        if (playersRes.data.ok) setPlayers(playersRes.data.players || []);
        if (rulesRes.data.ok) setRules({ rules: rulesRes.data.rules || [], goalie_save_tiers: rulesRes.data.goalie_save_tiers || [], goalie_goals_against: rulesRes.data.goalie_goals_against || [] });
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [scope]);

  const filteredPlayers = useMemo(() => {
    let list = [...players];
    const minG = minGames === "all" ? 0 : parseInt(minGames, 10);
    const maxG = maxGames === "all" ? Infinity : parseInt(maxGames, 10);
    const minP = minPrice === "all" ? 0 : parseInt(minPrice, 10);
    const maxP = maxPrice === "all" ? Infinity : parseInt(maxPrice, 10);
    list = list.filter((p) => {
      const gp = parseInt(p.games_played || "0", 10) || 0;
      const price = Number(p.current_price) || 0;
      return gp >= minG && gp <= maxG && price >= minP && price <= maxP;
    });
    const n = topN === "all" ? null : parseInt(topN, 10);
    if (n != null && n > 0) {
      const byPoints = topNBy === "points";
      const result: PlayerRow[] = [];
      for (const pos of ["F", "D", "G"]) {
        const posList = list.filter((p) => p.position === pos);
        const sorted = byPoints
          ? [...posList].sort((a, b) => (Number(b.season_total_fantasy_points) || 0) - (Number(a.season_total_fantasy_points) || 0))
          : [...posList].sort((a, b) => (Number(b.current_price) || 0) - (Number(a.current_price) || 0));
        result.push(...sorted.slice(0, n));
      }
      return result;
    }
    return list;
  }, [players, topN, topNBy, minGames, maxGames, minPrice, maxPrice]);

  const byPosition = useMemo(() => {
    const stats: PositionStats[] = [];
    for (const pos of ["F", "D", "G"]) {
      const list = filteredPlayers.filter((p) => p.position === pos);
      const count = list.length;
      const totalPoints = list.reduce((s, p) => s + (Number(p.season_total_fantasy_points) || 0), 0);
      const avgPoints = count ? totalPoints / count : 0;
      const avgPrice = count ? list.reduce((s, p) => s + (Number(p.current_price) || 0), 0) / count : 0;
      const avgStartPrice = count ? list.reduce((s, p) => s + (Number(p.start_price) || 0), 0) / count : 0;
      const slots = ROSTER_SLOTS[pos] ?? 1;
      const pointsPerSlot = slots ? totalPoints / count : 0;
      const valuePer1M = avgPrice > 0 ? (avgPoints / (avgPrice / 1_000_000)) : 0;
      stats.push({
        position: pos,
        label: POS_LABELS[pos] ?? pos,
        rosterSlots: slots,
        count,
        totalPoints,
        avgPoints,
        avgPrice,
        avgStartPrice,
        pointsPerSlot: count ? totalPoints / count : 0,
        valuePer1M,
      });
    }
    return stats;
  }, [filteredPlayers]);

  const formatPrice = (n: number) =>
    n == null || n === 0 ? "—" : `$${(n / 1_000_000).toFixed(2)}M`;
  const formatNum = (n: number, decimals = 1) =>
    n == null || isNaN(n) ? "—" : n.toFixed(decimals);

  if (loading) {
    return (
      <div className="text-text-muted text-sm font-bold uppercase tracking-wider py-12">
        Loading balance data…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-text-muted-subtle uppercase tracking-wider">
        Compare points and prices by position to tune economy and scoring. Use this to decide if goalies should be more/less expensive or if stat values need adjustment.
      </p>

      <div className="flex flex-wrap gap-6 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-text-muted-subtle uppercase">Data scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "all" | "period" | "current")}
            className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
          >
            <option value="all">All</option>
            <option value="current">Current season</option>
            <option value="period">Current period</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-text-muted-subtle uppercase">Limit to top N (per position)</label>
          <select
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
            className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
          >
            {TOP_N_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {topN !== "all" && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-text-muted-subtle uppercase">Top N by</label>
            <select
              value={topNBy}
              onChange={(e) => setTopNBy(e.target.value as "points" | "price")}
              className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
            >
              <option value="points">Points</option>
              <option value="price">Price</option>
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-text-muted-subtle uppercase">Min games</label>
          <select
            value={minGames}
            onChange={(e) => setMinGames(e.target.value)}
            className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
          >
            {MIN_GAMES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-text-muted-subtle uppercase">Max games (few matches)</label>
          <select
            value={maxGames}
            onChange={(e) => setMaxGames(e.target.value)}
            className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
          >
            {MAX_GAMES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-text-muted-subtle uppercase">Min price</label>
          <select
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
          >
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-text-muted-subtle uppercase">Max price</label>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-bg-secondary border border-border-default text-xs py-2 px-4 font-bold uppercase"
          >
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-[10px] text-text-muted-subtle">
        Showing {filteredPlayers.length} players (of {players.length} total) after filters. Top N is applied per position (F / D / G).
      </p>

      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-text-secondary mb-4">
          By position (roster: 3 F, 2 D, 1 G)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {byPosition.map((s) => (
            <div
              key={s.position}
              className="border border-border-default bg-bg-primary p-5 space-y-3"
            >
              <h3 className="text-xs font-black uppercase tracking-widest text-accent-primary">
                {s.label}
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-text-muted-subtle">Players</dt>
                <dd className="font-mono font-bold">{s.count}</dd>
                <dt className="text-text-muted-subtle">Roster slots</dt>
                <dd className="font-mono font-bold">{s.rosterSlots}</dd>
                <dt className="text-text-muted-subtle">Avg points</dt>
                <dd className="font-mono font-bold">{formatNum(s.avgPoints)}</dd>
                <dt className="text-text-muted-subtle">Total points</dt>
                <dd className="font-mono font-bold">{formatNum(s.totalPoints, 0)}</dd>
                <dt className="text-text-muted-subtle">Avg price (current)</dt>
                <dd className="font-mono font-bold">{formatPrice(s.avgPrice)}</dd>
                <dt className="text-text-muted-subtle">Avg price (start)</dt>
                <dd className="font-mono font-bold">{formatPrice(s.avgStartPrice)}</dd>
                <dt className="text-text-muted-subtle">Points per $1M</dt>
                <dd className="font-mono font-bold text-accent-success">{formatNum(s.valuePer1M)}</dd>
              </dl>
            </div>
          ))}
        </div>
      </div>

      {rules && (
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-text-secondary">
            Current scoring rules (from DB)
          </h2>
          <div className="overflow-x-auto border border-border-default">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-bg-sidebar text-text-inverse">
                <tr>
                  <th className="px-4 py-2 font-black uppercase">Rule</th>
                  <th className="px-4 py-2 font-black uppercase text-right">Goalie</th>
                  <th className="px-4 py-2 font-black uppercase text-right">Defense</th>
                  <th className="px-4 py-2 font-black uppercase text-right">Forward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rules.rules.map((r: ScoringRule) => (
                  <tr key={r.rule_key}>
                    <td className="px-4 py-2 font-bold text-text-secondary">{r.rule_key}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.goalie ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.defense ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.forward ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
