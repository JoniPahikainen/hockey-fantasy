import { useEffect, useState } from "react";
import api from "../../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type DataScope = "period" | "current" | "all";

interface PlayerDetailModalProps {
  playerId: number;
  onClose: () => void;
  onUpdated?: () => void;
  initialScope?: DataScope;
  /** When true, use GET /players/:id (for team page). When false, use GET /admin/players/:id (admin only). */
  usePublicApi?: boolean;
}

interface PlayerDetail {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  position: string;
  team: string;
  base_rating: number | null;
  start_price: number;
  current_price: number;
  game_stats: Array<{
    game_date: string;
    points_earned: string;
    goals: number;
    assists: number;
    sog: number;
    blocked_shots: number;
    toi_seconds: number;
    saves: number;
    goals_against: number;
    is_win: boolean;
    rolling_avg_5: number | null;
    rolling_avg_10: number | null;
  }>;
  period_breakdown: Array<{
    period_name: string;
    period_points: string;
    games_in_period: string;
  }>;
  price_history: Array<{ recorded_at: string; price: number }>;
  usage: Record<string, string | number>;
}

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const SCOPE_OPTIONS: { value: DataScope; label: string }[] = [
  { value: "period", label: "Current period" },
  { value: "current", label: "Current season" },
  { value: "all", label: "Full (all time)" },
];

export default function PlayerDetailModal({
  playerId,
  onClose,
  initialScope = "all",
  usePublicApi = false,
}: PlayerDetailModalProps) {
  const [scope, setScope] = useState<DataScope>(initialScope);
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = usePublicApi ? `/players/${playerId}` : `/admin/players/${playerId}`;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(url, {
          params: { season: scope },
        });
        if (res.data.ok && !cancelled) setDetail(res.data.player);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId, scope, usePublicApi]);

  if (loading || !detail) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-bg-sidebar/50"
        onClick={onClose}
      >
        <div
          className="bg-bg-primary p-8 rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-bold uppercase text-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  const games = detail.game_stats || [];
  const priceHistoryData = (detail.price_history || []).map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    price: h.price / 1_000_000,
  }));
  const pointsPerGame = games.map((g) => Number(g.points_earned));
  const avgPts = pointsPerGame.length
    ? (pointsPerGame.reduce((a, b) => a + b, 0) / pointsPerGame.length).toFixed(
        2,
      )
    : "0";
  const expectedFromBase =
    detail.base_rating != null ? Number(detail.base_rating) : 0;

  const goalsAssistsData =
    detail.position !== "G"
      ? [
          {
            name: "Goals",
            value: games.reduce((s, g) => s + (g.goals || 0), 0),
            color: COLORS[0],
          },
          {
            name: "Assists",
            value: games.reduce((s, g) => s + (g.assists || 0), 0),
            color: COLORS[1],
          },
        ].filter((d) => d.value > 0)
      : [];

  const gameChartData = games
    .slice()
    .reverse()
    .map((g, i) => ({
      game: i + 1,
      date: new Date(g.game_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      points: Number(g.points_earned),
      rolling5: g.rolling_avg_5,
      rolling10: g.rolling_avg_10,
      sog: g.sog,
      blocks: g.blocked_shots,
      toi: Math.round((g.toi_seconds || 0) / 60),
      saves: g.saves,
      ga: g.goals_against,
    }));

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-bg-sidebar/50 flex items-start justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary rounded-xl shadow-2xl max-w-5xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border-default flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {detail.name}{" "}
              <span className="text-text-muted-subtle">({detail.position})</span>
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {detail.team} • Base {detail.base_rating ?? "—"} • Start{" "}
              {(Math.floor(detail.start_price / 1000) * 1000)
                .toLocaleString("en-US")
                .replace(/,/g, " ")}{" "}
              • Current{" "}
              {(Math.floor(detail.current_price / 1000) * 1000)
                .toLocaleString("en-US")
                .replace(/,/g, " ")}
            </p>
            <div className="flex gap-1 mt-3">
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScope(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    scope === opt.value
                      ? "bg-accent-primary text-text-inverse"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted-subtle hover:text-text-primary font-bold text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Summary & usage */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Summary & usage
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-bg-secondary p-3 rounded-lg">
                <p className="text-[10px] uppercase text-text-muted">
                  {scope === "period"
                    ? "Period"
                    : scope === "current"
                      ? "Season"
                      : "All-time"}{" "}
                  total Pts
                </p>
                <p className="text-lg font-bold">
                  {games
                    .reduce((s, g) => s + Number(g.points_earned), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="bg-bg-secondary p-3 rounded-lg">
                <p className="text-[10px] uppercase text-text-muted">
                  Avg Pts/Game
                </p>
                <p className="text-lg font-bold">{avgPts}</p>
              </div>
              <div className="bg-bg-secondary p-3 rounded-lg">
                <p className="text-[10px] uppercase text-text-muted">
                  Performance vs expected
                </p>
                <p className="text-lg font-bold">
                  {expectedFromBase
                    ? `${(Number(avgPts) - expectedFromBase).toFixed(2)} vs base`
                    : "—"}
                </p>
              </div>
              {Object.entries(detail.usage || {}).map(([k, v]) => (
                <div key={k} className="bg-bg-secondary p-3 rounded-lg">
                  <p className="text-[10px] uppercase text-text-muted">
                    {k.replace(/_/g, " ")}
                  </p>
                  <p className="text-lg font-bold">{String(v)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Period breakdown */}
          {detail.period_breakdown?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Period-by-period fantasy points
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left p-2 font-bold">Period</th>
                      <th className="text-right p-2 font-bold">Points</th>
                      <th className="text-right p-2 font-bold">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.period_breakdown.map((pr) => (
                      <tr
                        key={pr.period_name}
                        className="border-b border-border-subtle"
                      >
                        <td className="p-2">{pr.period_name}</td>
                        <td className="p-2 text-right">
                          {Number(pr.period_points).toFixed(2)}
                        </td>
                        <td className="p-2 text-right">{pr.games_in_period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Price history */}
          {priceHistoryData.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Price history
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      fontSize={10}
                      tick={{ fill: "#64748b" }}
                    />
                    <YAxis fontSize={10} tick={{ fill: "#64748b" }} unit="M" />
                    <Tooltip
                      formatter={(v: number | undefined) => [
                        `${v ?? 0}M`,
                        "Price",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Game-by-game & rolling average */}
          {gameChartData.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Game-by-game points & rolling average (5 / 10)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gameChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      fontSize={9}
                      tick={{ fill: "#64748b" }}
                    />
                    <YAxis fontSize={9} tick={{ fill: "#64748b" }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke="#4f46e5"
                      name="Pts"
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rolling5"
                      stroke="#f59e0b"
                      name="Roll 5"
                      strokeDasharray="4 2"
                    />
                    <Line
                      type="monotone"
                      dataKey="rolling10"
                      stroke="#10b981"
                      name="Roll 10"
                      strokeDasharray="4 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Position-specific charts */}
          {detail.position === "F" && (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Goals vs assists contribution
                </h3>
                {goalsAssistsData.length > 0 ? (
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={goalsAssistsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        >
                          {goalsAssistsData.map((_, i) => (
                            <Cell key={i} fill={goalsAssistsData[i].color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-text-muted-subtle text-sm">
                    No goal/assist data yet.
                  </p>
                )}
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Shot volume trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip />
                      <Bar dataKey="sog" fill="#4f46e5" name="Shots" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}

          {detail.position === "D" && (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Blocked shots trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip />
                      <Bar dataKey="blocks" fill="#4f46e5" name="Blocks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  TOI trend (minutes)
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="toi"
                        stroke="#4f46e5"
                        name="TOI (min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}

          {detail.position === "G" && (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Saves per game trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip />
                      <Bar dataKey="saves" fill="#4f46e5" name="Saves" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Goals against trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="ga"
                        stroke="#ef4444"
                        name="GA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Fantasy points volatility (game-by-game)
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gameChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" fontSize={9} />
                      <YAxis fontSize={9} />
                      <Tooltip />
                      <Bar dataKey="points" fill="#8b5cf6" name="Fantasy Pts" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
