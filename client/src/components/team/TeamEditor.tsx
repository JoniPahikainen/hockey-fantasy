import { useState, useMemo, useEffect } from "react";
import TeamHeader from "./TeamHeader";
import FormationCard from "./FormationCard";
import PlayerDetailModal from "./PlayerDetailModal";
import api from "../../lib/api";
import { useActiveTeam } from "../../context/ActiveTeamContext";

type SortKey = "name" | "pos" | "team" | "points" | "salary";

export default function TeamEditor({ userId }: { userId: number }) {
  const [playerPool, setPlayerPool] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [lineup, setLineup] = useState<any[]>([]);
  const [savedLineupIds, setSavedLineupIds] = useState<number[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [detailPlayerId, setDetailPlayerId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tradeLockAlert, setTradeLockAlert] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [posFilter, setPosFilter] = useState("FORWARDS");
  const [teamFilters, setTeamFilters] = useState<string[]>([]);
  const [nextNightTeams, setNextNightTeams] = useState<string[]>([]);
  const [teamFilterOpen, setTeamFilterOpen] = useState(false);
  const { activeTeamId, activeTeamName } = useActiveTeam();
  const [tradeLocked, setTradeLocked] = useState(false);
  const [tradeLockReason, setTradeLockReason] = useState<string | null>(null);

  const [budgetTotal, setBudgetTotal] = useState<number | null>(null);
  
  useEffect(() => {
    const initPage = async () => {
      try {
        const poolRes = await api.get("/players/period");
        if (poolRes.data.ok) setPlayerPool(poolRes.data.players);
      } catch (err) {
        console.error("Initialization Error:", err);
      }
    };
    initPage();
  }, [userId]);

  useEffect(() => {
    const fetchNextNightTeams = async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const maxDaysToCheck = 60;
      for (let offset = 0; offset <= maxDaysToCheck; offset++) {
        const next = new Date(todayStr);
        next.setDate(next.getDate() + offset);
        const nextStr = next.toISOString().split("T")[0];
        try {
          const res = await api.get(`/matches/${nextStr}`);
          if (res.data.ok && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
            const teams = new Set<string>();
            for (const match of res.data.matches) {
              if (match.home_team_abbrev) teams.add(String(match.home_team_abbrev).toUpperCase());
              if (match.away_team_abbrev) teams.add(String(match.away_team_abbrev).toUpperCase());
            }
            setNextNightTeams([...teams].sort());
            return;
          }
        } catch {
          // continue searching the next day
        }
      }
      setNextNightTeams([]);
    };

    fetchNextNightTeams();
  }, []);

  useEffect(() => {
    const fetchLockStatus = async () => {
      try {
        const lockRes = await api.get("/fantasy-teams/trade-lock/status");
        const status = lockRes.data?.status;
        const locked = Boolean(status?.locked);
        setTradeLocked(locked);
        if (locked) {
          const msg = `Trading is locked (${status.reason}).`;
          setTradeLockReason(msg);
          setTradeLockAlert(msg);
        } else {
          setTradeLockReason(null);
          setTradeLockAlert(null);
        }
      } catch {
        // If lock check fails, fall back to previous behavior (allow trading).
      }
    };
    fetchLockStatus();
  }, []);

  useEffect(() => {
    if (activeTeamId) {
      setSelectedTeamId(activeTeamId);
    } else {
      setSelectedTeamId(null);
    }
  }, [activeTeamId]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const fetchLineup = async () => {
      const res = await api.get(`/fantasy-teams/${selectedTeamId}/players`);
      if (res.data.ok) {
        const p = res.data.players.map((x: any) => ({ ...x, id: x.player_id }));
        const initialSpent = p.reduce(
          (sum: number, row: any) => sum + (Number(row.salary) || 0),
          0,
        );
        const initialBudgetRemaining = Number(res.data.budget_remaining ?? 0);
        setBudgetTotal(initialBudgetRemaining + initialSpent);
        setLineup(p);
        setSavedLineupIds(p.map((x: any) => x.id));
        const cap = p.find((x: any) => x.is_captain);
        setCaptainId(cap ? cap.id : null);
      }
    };
    fetchLineup();
  }, [selectedTeamId]);

  const isDirty = useMemo(() => {
    if (lineup.length !== savedLineupIds.length) return true;
    return (
      lineup
        .map((p) => p.id)
        .sort()
        .join() !== [...savedLineupIds].sort().join()
    );
  }, [lineup, savedLineupIds]);

  const totalSalary = useMemo(
    () => lineup.reduce((s, p) => s + (Number(p.salary) || 0), 0),
    [lineup]
  );

  const availableCash =
    budgetTotal == null ? null : budgetTotal - totalSalary;

  const saveLineup = async () => {
    setTradeLockAlert(null);
    if (selectedTeamId == null) return;
    try {
      if (tradeLocked) {
        const msg =
          tradeLockReason ||
          "Trading is locked. Next match: n/a";
        window.alert(msg);
        setTradeLockAlert(msg);
        return;
      }
      setIsSaving(true);
      const res = await api.post("/fantasy-teams/save-lineup", {
        team_id: selectedTeamId,
        playerIds: lineup.map((p) => p.id),
      });
      if (res.data.ok) {
        setSavedLineupIds(lineup.map((p) => p.id));
        if (typeof res.data.budget_remaining === "number") {
          const spent = lineup.reduce(
            (sum: number, p: any) => sum + (Number(p.salary) || 0),
            0,
          );
          setBudgetTotal(Number(res.data.budget_remaining) + spent);
        }
      }
    } catch (err) {
      const statusCode = (err as any)?.response?.status;
      const serverMsg =
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.message;

      if (statusCode === 423) {
        window.alert(serverMsg || "Trading is locked.");
        setTradeLockAlert(serverMsg || "Trading is locked.");
        return;
      }
      console.error(err);
    }
    setIsSaving(false);
  };

  const removeFromLineup = (id: number) => {
    setLineup((prev) => prev.filter((p) => p.id !== id));
    if (captainId === id) setCaptainId(null);
  };

  const addToLineup = (player: any) => {
    if (tradeLocked) return;
    if (lineup.find((p) => p.id === player.id)) return;
    const limits = { F: 3, D: 2, G: 1 };
    if (
      lineup.filter((p) => p.pos === player.pos).length <
      limits[player.pos as keyof typeof limits]
    ) {
      if (availableCash != null) {
        const cost = Number(player.salary) || 0;
        if (cost > availableCash) return;
      }
      setLineup([...lineup, player]);
    }
  };

  const setCaptain = async (playerId: number) => {
    const newId = captainId === playerId ? null : playerId;
    if (selectedTeamId == null) return;
    setTradeLockAlert(null);
    try {
      if (tradeLocked) {
        const msg =
          tradeLockReason ||
          "Trading is locked. Next match: n/a";
        window.alert(msg);
        setTradeLockAlert(msg);
        return;
      }
      await api.patch(`/fantasy-teams/${selectedTeamId}/captain`, {
        player_id: newId,
      });
      setCaptainId(newId);
    } catch (err) {
      const statusCode = (err as any)?.response?.status;
      const serverMsg =
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.message;
      if (statusCode === 423) {
        window.alert(serverMsg || "Trading is locked.");
        setTradeLockAlert(serverMsg || "Trading is locked.");
        return;
      }
      console.error(err);
    }
  };

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({
    key: "points",
    direction: "desc",
  });

  const formatSalary = (num: number) =>
    (Math.floor(Number(num) / 1000) * 1000).toLocaleString("en-US").replace(/,/g, " ");

  const teamsList = useMemo(
    () => [...new Set(playerPool.map((p) => String(p.team).toUpperCase()))].sort(),
    [playerPool]
  );

  const toggleTeamSelection = (value: string) => {
    setTeamFilters((prev) => {
      if (value === "PLAYING_NEXT_NIGHT") {
        return prev.includes("PLAYING_NEXT_NIGHT") ? [] : ["PLAYING_NEXT_NIGHT"];
      }

      const base = prev.filter((x) => x !== "PLAYING_NEXT_NIGHT");
      if (base.includes(value)) {
        return base.filter((x) => x !== value);
      }
      return [...base, value];
    });
  };

  const teamFilterSummary = useMemo(() => {
    if (teamFilters.length === 0) return "ALL";
    if (teamFilters.includes("PLAYING_NEXT_NIGHT")) return "PLAYING NEXT NIGHT";
    const text = teamFilters.join(", ");
    return text.length > 28 ? `${text.slice(0, 28).trimEnd()}, ...` : text;
  }, [teamFilters]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const processedPool = useMemo(() => {
    let result = playerPool.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPos =
        posFilter === "ALL" ||
        (posFilter === "FORWARDS" ? p.pos === "F" : p.pos === posFilter);
      const normalizedTeam = String(p.team).toUpperCase();
      const matchesTeam =
        teamFilters.length === 0 ||
        (teamFilters.includes("PLAYING_NEXT_NIGHT")
          ? nextNightTeams.includes(normalizedTeam)
          : teamFilters.includes(normalizedTeam));
      return matchesSearch && matchesPos && matchesTeam;
    });

    result.sort((a: any, b: any) => {
      const numericKeys: SortKey[] = ["points", "salary"];

      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (numericKeys.includes(sortConfig.key)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB)
        return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB)
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [playerPool, searchTerm, posFilter, teamFilters, nextNightTeams, sortConfig]);

  return (

    <div className="flex-1 overflow-y-auto relative">
      {/* HEADER */}
      <TeamHeader
        activeTeamName={activeTeamName || "—"}
        lineupCount={lineup.length}
        totalSalary={totalSalary}
        budgetRemaining={availableCash ?? 0}
        isDirty={isDirty}
        isSaving={isSaving}
        tradingLocked={tradeLocked}
        onSave={saveLineup}
      />

      {tradeLockAlert && (
        <div className="px-6 pb-4">
          <div className="bg-accent-danger-muted border border-accent-danger-muted text-accent-danger text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-lg">
            {tradeLockAlert}
          </div>
        </div>
      )}

      {/* FORMATION AREA */}
      <div className="p-8 bg-bg-tertiary border-b border-border-input">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <FormationCard
                key={`f-${i}`}
                label="FWD"
                onRemove={removeFromLineup}
                onSetCaptain={setCaptain}
                isCaptain={lineup.filter((p) => p.pos === "F")[i]?.id === captainId}
                player={lineup.filter((p) => p.pos === "F")[i]}
                readOnly={tradeLocked}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
            {[...Array(2)].map((_, i) => (
              <FormationCard
                key={`d-${i}`}
                label="DEF"
                onRemove={removeFromLineup}
                onSetCaptain={setCaptain}
                isCaptain={lineup.filter((p) => p.pos === "D")[i]?.id === captainId}
                player={lineup.filter((p) => p.pos === "D")[i]}
                readOnly={tradeLocked}
              />
            ))}
          </div>
          <div className="max-w-xs mx-auto w-full">
            <FormationCard
              label="GOALIE"
              isGoalie
              onRemove={removeFromLineup}
              onSetCaptain={setCaptain}
              isCaptain={lineup.find((p) => p.pos === "G")?.id === captainId}
              player={lineup.find((p) => p.pos === "G")}
              readOnly={tradeLocked}
            />
          </div>
        </div>
      </div>

      {/* PLAYER POOL TABLE */}
      <section className="p-8 bg-bg-primary min-h-[600px]">
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-text-muted-subtle uppercase">
              Search
            </span>
            <input
              type="text"
              placeholder="PLAYER NAME..."
              className="bg-bg-secondary border border-border-default text-[10px] py-2.5 px-4 font-bold uppercase w-64 outline-none focus:border-border-strong"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-text-muted-subtle uppercase">
              Position
            </span>
            <select
              className="bg-bg-secondary border border-border-default text-[10px] py-2.5 px-4 font-bold uppercase outline-none min-w-[120px]"
              onChange={(e) => setPosFilter(e.target.value)}
            >
              <option value="FORWARDS">FORWARDS</option>
              <option value="D">DEFENCE</option>
              <option value="G">GOALIE</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 relative">
            <span className="text-[9px] font-black text-text-muted-subtle uppercase">
              Team
            </span>
            <button
              type="button"
              onClick={() => setTeamFilterOpen((v) => !v)}
              className="bg-bg-secondary border border-border-default text-[10px] py-2.5 px-4 font-bold uppercase outline-none min-w-[170px] text-left flex items-center justify-between gap-3"
            >
              <span className="truncate">{teamFilterSummary}</span>
              <span>{teamFilterOpen ? "▲" : "▼"}</span>
            </button>

            {teamFilterOpen && (
              <div className="absolute top-[56px] left-0 z-30 bg-bg-secondary border border-border-default min-w-[220px] max-h-64 overflow-auto shadow-lg p-2">
                <button
                  type="button"
                  onClick={() => toggleTeamSelection("PLAYING_NEXT_NIGHT")}
                  className={`w-full flex items-center justify-between text-[10px] font-bold uppercase px-2 py-1.5 hover:bg-bg-tertiary ${
                    teamFilters.includes("PLAYING_NEXT_NIGHT") ? "text-accent-primary" : ""
                  }`}
                >
                  <span>PLAYING NEXT NIGHT</span>
                  <input
                    type="checkbox"
                    checked={teamFilters.includes("PLAYING_NEXT_NIGHT")}
                    readOnly
                    className="h-3.5 w-3.5 accent-accent-primary pointer-events-none"
                  />
                </button>
                <div className="my-1 border-t border-border-subtle" />
                {teamsList.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => toggleTeamSelection(team)}
                    className={`w-full flex items-center justify-between text-[10px] font-bold uppercase px-2 py-1.5 hover:bg-bg-tertiary disabled:opacity-50 ${
                      teamFilters.includes(team) ? "text-accent-primary" : ""
                    }`}
                    disabled={teamFilters.includes("PLAYING_NEXT_NIGHT")}
                  >
                    <span>{team}</span>
                    <input
                      type="checkbox"
                      checked={teamFilters.includes(team)}
                      readOnly
                      className="h-3.5 w-3.5 accent-accent-primary pointer-events-none"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-border-default">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-bg-sidebar text-text-inverse z-20">
              <tr className="text-[9px] font-black uppercase tracking-widest cursor-pointer">
                <th className="px-6 py-4" onClick={() => requestSort("name")}>
                  Player
                </th>
                <th className="px-6 py-4" onClick={() => requestSort("pos")}>
                  Pos
                </th>
                <th className="px-6 py-4" onClick={() => requestSort("team")}>
                  Team
                </th>
                <th
                  className="px-6 py-4 text-right"
                  onClick={() => requestSort("points")}
                >
                  Pts
                </th>
                <th
                  className="px-6 py-4 text-right"
                  onClick={() => requestSort("salary")}
                >
                  Salary
                </th>
                <th className="px-6 py-4 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {processedPool.map((player) => {
                const playerId = player.player_id || player.id;
                const isSelected = lineup.find((p) => (p.player_id || p.id) === playerId);
                const limits = { F: 3, D: 2, G: 1 };
                const posCount = lineup.filter((p) => p.pos === player.pos).length;
                const isSlotFull = !isSelected && posCount >= limits[player.pos as keyof typeof limits];
                const cost = Number(player.salary) || 0;
                const canAfford = availableCash == null || cost <= availableCash;
                return (
                  <tr
                    key={player.id}
                    className={`hover:bg-bg-secondary transition-colors ${isSelected ? "opacity-30" : ""
                      }`}
                  >
                    <td className="px-6 py-4 font-black text-xs uppercase">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-text-muted-subtle">
                      {player.pos}
                    </td>
                    <td
                      style={{ color: player.color }}
                      className="px-6 py-4 text-[10px] font-bold text-text-muted-subtle"
                    >
                      {player.team}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold">
                      {Number(player.points)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold text-text-primary">
                      ${formatSalary(player.salary)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailPlayerId(playerId)}
                          className="text-[9px] font-black uppercase text-accent-primary hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => addToLineup(player)}
                          disabled={isSelected || tradeLocked || isSlotFull || !canAfford}
                          className="text-[9px] font-black uppercase px-6 py-2 border border-border-strong hover:bg-bg-sidebar hover:text-text-inverse disabled:opacity-0 transition-all"
                        >
                          Select
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {detailPlayerId != null && (
        <PlayerDetailModal
          playerId={detailPlayerId}
          onClose={() => setDetailPlayerId(null)}
          initialScope="period"
        />
      )}
    </div>
  );
}
