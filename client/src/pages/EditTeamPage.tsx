import { useState, useMemo, useEffect } from "react";
import Sidebar from "../components/common/Sidebar";
import TeamHeader from "../components/team/TeamHeader";
import FormationCard from "../components/team/FormationCard";
import api from "../lib/api";

type SortKey = "name" | "pos" | "team" | "points" | "salary";

export default function DailyTeamPage() {
  const [playerPool, setPlayerPool] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [lineup, setLineup] = useState<any[]>([]);
  const [savedLineupIds, setSavedLineupIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [posFilter, setPosFilter] = useState("FORWARDS");
  const [teamFilter, setTeamFilter] = useState("ALL");

  useEffect(() => {
    const initPage = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          window.location.href = "/login";
          return null;
        }
        
        const user = JSON.parse(userStr);
        const userId = user.id;

        const [poolRes, teamsRes] = await Promise.all([
          api.get("/players"),
          api.get(`/fantasy-teams/owner/${userId}`),
        ]);

        if (poolRes.data.ok) setPlayerPool(poolRes.data.players);
        
        if (teamsRes.data.ok && teamsRes.data.teams.length > 0) {
          setUserTeams(teamsRes.data.teams);
          
          setSelectedTeamId(teamsRes.data.teams[0].team_id);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    const fetchLineup = async () => {
      const res = await api.get(`/fantasy-teams/${selectedTeamId}/players`);
      if (res.data.ok) {
        const p = res.data.players.map((x: any) => ({ ...x, id: x.player_id }));
        setLineup(p);
        setSavedLineupIds(p.map((x: any) => x.id));
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

  const saveLineup = async () => {
    setIsSaving(true);
    try {
      const res = await api.post("/fantasy-teams/save-lineup", {
        team_id: selectedTeamId,
        playerIds: lineup.map((p) => p.id),
      });
      if (res.data.ok) {
        setSavedLineupIds(lineup.map((p) => p.id));
        setUserTeams((prev) =>
          prev.map((t) =>
            t.team_id === selectedTeamId
              ? { ...t, budget_remaining: res.data.budget_remaining }
              : t
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const removeFromLineup = (id: number) =>
    setLineup((prev) => prev.filter((p) => p.id !== id));

  const addToLineup = (player: any) => {
    if (lineup.find((p) => p.id === player.id)) return;
    const limits = { F: 3, D: 2, G: 1 };
    if (
      lineup.filter((p) => p.pos === player.pos).length <
      limits[player.pos as keyof typeof limits]
    ) {
      setLineup([...lineup, player]);
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
    new Intl.NumberFormat("en-US").format(num);

  const teamsList = useMemo(
    () => ["ALL", ...new Set(playerPool.map((p) => p.team))].sort(),
    [playerPool]
  );

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
      const matchesTeam = teamFilter === "ALL" || p.team === teamFilter;
      return matchesSearch && matchesPos && matchesTeam;
    });

    result.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [playerPool, searchTerm, posFilter, teamFilter, sortConfig]);

  return (
    <div className="flex bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col ml-16">
        {/* HEADER */}
        <TeamHeader
          userTeams={userTeams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          lineupCount={lineup.length}
          totalSalary={totalSalary}
          isDirty={isDirty}
          isSaving={isSaving}
          onSave={saveLineup}
        />

        {/* FORMATION AREA */}
        <div className="overflow-y-auto p-8 bg-slate-100 border-b border-slate-300">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <FormationCard
                  key={`f-${i}`}
                  label="FWD"
                  onRemove={removeFromLineup}
                  player={lineup.filter((p) => p.pos === "F")[i]}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
              {[...Array(2)].map((_, i) => (
                <FormationCard
                  key={`d-${i}`}
                  label="DEF"
                  onRemove={removeFromLineup}
                  player={lineup.filter((p) => p.pos === "D")[i]}
                />
              ))}
            </div>
            <div className="max-w-xs mx-auto w-full">
              <FormationCard
                label="GOALIE"
                isGoalie
                onRemove={removeFromLineup}
                player={lineup.find((p) => p.pos === "G")}
              />
            </div>
          </div>
        </div>

        {/* PLAYER POOL TABLE */}
        <section className="flex-1 overflow-hidden flex flex-col p-8 bg-white">
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Search
              </span>
              <input
                type="text"
                placeholder="PLAYER NAME..."
                className="bg-slate-50 border border-slate-200 text-[10px] py-2.5 px-4 font-bold uppercase w-64 outline-none focus:border-black"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Position
              </span>
              <select
                className="bg-slate-50 border border-slate-200 text-[10px] py-2.5 px-4 font-bold uppercase outline-none min-w-[120px]"
                onChange={(e) => setPosFilter(e.target.value)}
              >
                <option value="FORWARDS">FORWARDS</option>
                <option value="D">DEFENCE</option>
                <option value="G">GOALIE</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Team
              </span>
              <select
                className="bg-slate-50 border border-slate-200 text-[10px] py-2.5 px-4 font-bold uppercase outline-none min-w-[120px]"
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {teamsList.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900 text-white z-20">
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
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedPool.map((player) => {
                  const playerId = player.player_id || player.id;
                  const isSelected = lineup.find((p) => (p.player_id || p.id) === playerId);
                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? "opacity-30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-black text-xs uppercase">
                        {player.name}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                        {player.pos}
                      </td>
                      <td
                        style={{ color: player.color }}
                        className="px-6 py-4 text-[10px] font-bold text-slate-400"
                      >
                        {player.team}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold">
                        {Number(player.points).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">
                        ${formatSalary(player.salary)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => addToLineup(player)}
                          disabled={isSelected}
                          className="text-[9px] font-black uppercase px-6 py-2 border border-black hover:bg-black hover:text-white disabled:opacity-0 transition-all"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
