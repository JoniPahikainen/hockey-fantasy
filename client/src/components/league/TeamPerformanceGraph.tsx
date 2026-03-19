import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from "recharts";
import api from "../../lib/api";

interface Props {
  teamId: number;
  periodId: number;
}

interface BreakdownRow {
  player_name: string;
  points: number;
}

export default function TeamPerformanceGraph({ teamId, periodId }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(
          `/leagues/${teamId}/performance/period/${periodId}`
        );
        if (data.ok && Array.isArray(data.performance)) {
          const formatted = data.performance.map((d: any) => ({
            ...d,
            shortDate: new Date(d.game_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          }));
          setData(formatted);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Graph fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [teamId, periodId]);

  const handlePointClick = async (payload: { game_date: string }) => {
    if (!payload?.game_date) return;
    const dateStr =
      typeof payload.game_date === "string"
        ? payload.game_date.slice(0, 10)
        : new Date(payload.game_date).toISOString().slice(0, 10);
    setSelectedDay(dateStr);
    setLoadingBreakdown(true);
    setBreakdown([]);
    try {
      const { data: res } = await api.get(
        `/leagues/${teamId}/performance/day/${dateStr}`
      );
      if (res.ok && Array.isArray(res.breakdown)) {
        setBreakdown(
          res.breakdown.map((r: any) => ({
            player_name: r.player_name,
            points: Number(r.points),
          }))
        );
      }
    } catch (err) {
      console.error("Breakdown fetch error:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-[10px] font-bold uppercase animate-pulse">
        Loading Chart Data...
      </div>
    );

  const displayDate = selectedDay
    ? new Date(selectedDay + "Z").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="w-full bg-bg-secondary border-t border-border-default">
      <div className="h-64 w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="shortDate"
              fontSize={9}
              fontWeight="bold"
              tick={{ fill: "#94a3b8" }}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              fontSize={9}
              fontWeight="bold"
              tick={{ fill: "#64748b" }}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              fontSize={9}
              fontWeight="bold"
              tick={{ fill: "#818cf8" }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
              }}
              itemStyle={{
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            />
            <Bar
              yAxisId="right"
              dataKey="active_players_count"
              fill="#e2e8f0"
              barSize={20}
              name="Players Active"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="points"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#4f46e5"
                    cursor="pointer"
                    onClick={() => payload?.game_date && handlePointClick(payload)}
                  />
                );
              }}
              activeDot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#4f46e5"
                    cursor="pointer"
                    onClick={() => payload?.game_date && handlePointClick(payload)}
                  />
                );
              }}
              name="Points"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {(selectedDay || loadingBreakdown) && (
        <div className="px-4 pb-4 pt-2 border-t border-border-default">
          <p className="text-[10px] font-black uppercase text-text-muted-subtle tracking-widest mb-2">
            {displayDate}
            {loadingBreakdown ? " — Loading…" : " — Points by player"}
          </p>
          {loadingBreakdown ? (
            <div className="text-[10px] font-bold uppercase text-text-muted-subtle animate-pulse">
              Loading…
            </div>
          ) : breakdown.length > 0 ? (
            <ul className="space-y-1">
              {breakdown.map((row, i) => (
                <li
                  key={i}
                  className="flex justify-between items-baseline text-xs font-bold uppercase"
                >
                  <span className="text-text-secondary">{row.player_name}</span>
                  <span className="font-mono text-text-primary">
                    {row.points}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] font-bold uppercase text-text-muted-subtle italic">
              No player points this day
            </p>
          )}
        </div>
      )}
    </div>
  );
}
