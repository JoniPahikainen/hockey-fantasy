import { useEffect, useState, useMemo } from "react";
import api from "../../lib/api";
import PlayerDetailModal from "./PlayerDetailModal";

interface PlayerRow {
  id: number;
  name: string;
  position: string;
  team: string;
  base_rating: number | null;
  start_price: number;
  current_price: number;
  season_total_fantasy_points: string;
  games_played: string;
  avg_points_per_game: string;
}

type SortKey =
  | "name"
  | "position"
  | "team"
  | "base_rating"
  | "start_price"
  | "current_price"
  | "season_total_fantasy_points"
  | "avg_points_per_game"
  | "games_played";
type SortDir = "asc" | "desc";

export default function MarketOverviewTable() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<PlayerRow>>({});
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [filterPos, setFilterPos] = useState<string>("");
  const [seasonFilter, setSeasonFilter] = useState<
    "current" | "all" | "period"
  >("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/players", {
        params: { season: seasonFilter },
      });
      if (res.data.ok) setPlayers(res.data.players || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [seasonFilter]);

  const teams = useMemo(() => {
    const set = new Set(players.map((p) => p.team).filter(Boolean));
    return Array.from(set).sort();
  }, [players]);

  const filteredAndSorted = useMemo(() => {
    let list = players;
    if (filterTeam) list = list.filter((p) => p.team === filterTeam);
    if (filterPos) list = list.filter((p) => p.position === filterPos);
    list = [...list].sort((a, b) => {
      let va: string | number | boolean;
      let vb: string | number | boolean;
      switch (sortKey) {
        case "name":
          va = a.name ?? "";
          vb = b.name ?? "";
          break;
        case "position":
          va = a.position ?? "";
          vb = b.position ?? "";
          break;
        case "team":
          va = a.team ?? "";
          vb = b.team ?? "";
          break;
        case "base_rating":
          va = a.base_rating != null ? Number(a.base_rating) : -1e9;
          vb = b.base_rating != null ? Number(b.base_rating) : -1e9;
          break;
        case "start_price":
          va = Number(a.start_price) ?? 0;
          vb = Number(b.start_price) ?? 0;
          break;
        case "current_price":
          va = Number(a.current_price) ?? 0;
          vb = Number(b.current_price) ?? 0;
          break;
        case "season_total_fantasy_points":
          va = Number(a.season_total_fantasy_points) ?? 0;
          vb = Number(b.season_total_fantasy_points) ?? 0;
          break;
        case "avg_points_per_game":
          va = Number(a.avg_points_per_game) ?? 0;
          vb = Number(b.avg_points_per_game) ?? 0;
          break;
        case "games_played":
          va = Number(a.games_played) ?? 0;
          vb = Number(b.games_played) ?? 0;
          break;
        default:
          return 0;
      }
      if (typeof va === "string" && typeof vb === "string") {
        const c = va.localeCompare(vb);
        return sortDir === "asc" ? c : -c;
      }
      const c = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? c : -c;
    });
    return list;
  }, [players, filterTeam, filterPos, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortTh = ({ colKey, label }: { colKey: SortKey; label: string }) => (
    <th className="p-3 font-bold uppercase tracking-wider text-slate-600">
      <button
        type="button"
        onClick={() => handleSort(colKey)}
        className="text-left hover:text-slate-900 flex items-center gap-1"
      >
        {label}
        {sortKey === colKey && (
          <span className="text-[10px]" aria-hidden>
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </th>
  );

  const startEdit = (p: PlayerRow) => {
    setEditing(p.id);
    setDraft({
      base_rating: p.base_rating ?? undefined,
      start_price: p.start_price,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft({});
  };

  const saveEdit = async (id: number) => {
    const base_rating = draft.base_rating;
    const start_price = draft.start_price;
    if (base_rating === undefined && start_price === undefined) {
      cancelEdit();
      return;
    }
    setSaving(id);
    try {
      const payload: Record<string, unknown> = {};
      if (base_rating !== undefined) payload.base_rating = base_rating;
      if (start_price !== undefined) payload.start_price = start_price;
      const res = await api.patch(`/admin/players/${id}`, payload);
      if (res.data.ok) {
        setPlayers((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, ...res.data.player } : row,
          ),
        );
        cancelEdit();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const roundByThousand = (n: number) => Math.floor(Number(n) / 1000) * 1000;
  const formatPrice = (n: number) =>
    n == null
      ? "—"
      : roundByThousand(n).toLocaleString("en-US").replace(/,/g, " ");
  const formatNum = (x: string | number) =>
    x == null ? "—" : typeof x === "number" ? String(x) : Number(x).toFixed(2);

  if (loading)
    return (
      <div className="text-slate-500 text-sm font-bold uppercase tracking-wider py-12">
        Loading market data…
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider">
        Current price is system-generated; only base rating, start price, and
        injury are editable.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase text-slate-600">
            Data
          </label>
          <select
            value={seasonFilter}
            onChange={(e) => {
              const v = e.target.value;
              setSeasonFilter(
                v === "period" ? "period" : v === "current" ? "current" : "all",
              );
            }}
            className="border border-slate-300 px-2 py-1.5 text-sm bg-white min-w-[140px]"
          >
            <option value="all">All data</option>
            <option value="current">Current season</option>
            <option value="period">Current period</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase text-slate-600">
            Team
          </label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="border border-slate-300 px-2 py-1.5 text-sm bg-white min-w-[100px]"
          >
            <option value="">All</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase text-slate-600">
            Pos
          </label>
          <select
            value={filterPos}
            onChange={(e) => setFilterPos(e.target.value)}
            className="border border-slate-300 px-2 py-1.5 text-sm bg-white min-w-[80px]"
          >
            <option value="">All</option>
            <option value="F">F</option>
            <option value="D">D</option>
            <option value="G">G</option>
          </select>
        </div>
        <span className="text-xs text-slate-500">
          {filteredAndSorted.length} player
          {filteredAndSorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <SortTh colKey="name" label="Name" />
              <SortTh colKey="position" label="Pos" />
              <SortTh colKey="team" label="Team" />
              <SortTh colKey="base_rating" label="Base rating" />
              <SortTh colKey="start_price" label="Start price" />
              <SortTh colKey="current_price" label="Current price" />
              <SortTh colKey="season_total_fantasy_points" label="Season Pts" />
              <SortTh colKey="avg_points_per_game" label="Avg/G" />
              <SortTh colKey="games_played" label="GP" />
              <th className="p-3 font-bold uppercase tracking-wider text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((p) => (
              <tr
                key={p.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.position}</td>
                <td className="p-3">{p.team}</td>
                <td className="p-3">
                  {editing === p.id ? (
                    <input
                      type="number"
                      step="0.01"
                      className="w-20 border border-slate-300 px-2 py-1 text-xs"
                      value={draft.base_rating ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          base_rating:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    formatNum(p.base_rating ?? "—")
                  )}
                </td>
                <td className="p-3">
                  {editing === p.id ? (
                    <input
                      type="number"
                      className="w-24 border border-slate-300 px-2 py-1 text-xs"
                      value={draft.start_price ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          start_price:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        }))
                      }
                    />
                  ) : (
                    formatPrice(p.start_price)
                  )}
                </td>
                <td className="p-3 text-slate-600">
                  {formatPrice(p.current_price)}
                </td>
                <td className="p-3">
                  {formatNum(p.season_total_fantasy_points)}
                </td>
                <td className="p-3">{formatNum(p.avg_points_per_game)}</td>
                <td className="p-3">{p.games_played}</td>
                <td className="p-3">
                  {editing === p.id ? (
                    <span className="flex gap-2">
                      <button
                        className="text-xs font-bold uppercase bg-slate-900 text-white px-2 py-1"
                        onClick={() => saveEdit(p.id)}
                        disabled={saving === p.id}
                      >
                        {saving === p.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        className="text-xs font-bold uppercase text-slate-500 hover:text-slate-800"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span className="flex gap-2">
                      <button
                        className="text-xs font-bold uppercase text-indigo-600 hover:underline"
                        onClick={() => setDetailId(p.id)}
                      >
                        View
                      </button>
                      <button
                        className="text-xs font-bold uppercase text-slate-500 hover:underline"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailId != null && (
        <PlayerDetailModal
          playerId={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={() => fetchPlayers()}
          initialScope={seasonFilter}
        />
      )}
    </div>
  );
}
