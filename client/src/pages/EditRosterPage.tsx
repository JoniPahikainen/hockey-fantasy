import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { PLAYER_POOL, TEAM_DATA } from "../data/mockData";

type SortKey = "name" | "pos" | "team" | "points" | "salary";

export default function DailyRosterPage() {
  const initialLineup = useMemo(() => {
    return TEAM_DATA.map((oldPlayer) =>
      PLAYER_POOL.find((p) => p.name === oldPlayer.name)
    ).filter(Boolean);
  }, []);

  const [lineup, setLineup] = useState<any[]>(initialLineup);
  const [searchTerm, setSearchTerm] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({
    key: "points",
    direction: "desc",
  });

  const formatSalary = (num: number) =>
    new Intl.NumberFormat("en-US").format(num);
  const totalSalary = useMemo(
    () => lineup.reduce((sum, p) => sum + (p?.salary || 0), 0),
    [lineup]
  );
  const teamsList = useMemo(
    () => ["ALL", ...new Set(PLAYER_POOL.map((p) => p.team))].sort(),
    []
  );

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const addToLineup = (player: any) => {
    if (lineup.find((p) => p.id === player.id)) return;

    const limits = { F: 3, D: 2, G: 1 };
    const currentCount = lineup.filter((p) => p.pos === player.pos).length;

    if (currentCount < limits[player.pos as keyof typeof limits]) {
      setLineup([...lineup, player]);
    } else {
      alert(`${player.pos} slots are full!`);
    }
  };

  const removeFromLineup = (id: number) =>
    setLineup(lineup.filter((p) => p.id !== id));

  // FILTER & SORT LOGIC
  const processedPool = useMemo(() => {
    let result = PLAYER_POOL.filter((p) => {
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
  }, [searchTerm, posFilter, teamFilter, sortConfig]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar onLogout={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TACTICAL VIEW (3-2-1) */}
        <section className="p-6 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                Roster Edit
              </h1>
              <div className="mt-2 bg-slate-900 text-white inline-block px-3 py-1">
                <p className="text-[8px] font-black uppercase opacity-50">
                  Total Salary
                </p>
                <p className="text-sm font-mono font-bold">
                  ${formatSalary(totalSalary)}
                </p>
              </div>
            </div>
            <button className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
              Save Nightly Team
            </button>
          </div>

          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <div className="flex justify-center gap-3">
              {[...Array(3)].map((_, i) => (
                <SlotCard
                  key={`f-${i}`}
                  player={lineup.filter((p) => p.pos === "F")[i]}
                  label="ATK"
                  onRemove={removeFromLineup}
                />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              {[...Array(2)].map((_, i) => (
                <SlotCard
                  key={`d-${i}`}
                  player={lineup.filter((p) => p.pos === "D")[i]}
                  label="DEF"
                  onRemove={removeFromLineup}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <SlotCard
                player={lineup.find((p) => p.pos === "G")}
                label="G"
                onRemove={removeFromLineup}
              />
            </div>
          </div>
        </section>

        {/* POOL SECTION */}
        <section className="flex-1 overflow-hidden flex flex-col p-6 bg-white">
          <div className="flex flex-wrap gap-4 mb-4 items-end">
            <input
              type="text"
              placeholder="SEARCH PLAYER..."
              className="bg-slate-50 border border-slate-200 text-[10px] py-2 px-3 font-bold uppercase w-48 outline-none focus:border-black"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="bg-slate-50 border border-slate-200 text-[10px] py-2 px-3 font-bold uppercase outline-none"
              onChange={(e) => setPosFilter(e.target.value)}
            >
              <option value="ALL">ALL POS</option>
              <option value="FORWARDS">FORWARDS</option>
              <option value="D">DEFENCE</option>
              <option value="G">GOALIE</option>
            </select>
            <select
              className="bg-slate-50 border border-slate-200 text-[10px] py-2 px-3 font-bold uppercase outline-none"
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              {teamsList.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "ALL TEAMS" : t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900 text-white z-20">
                <tr className="text-[9px] font-black uppercase tracking-widest cursor-pointer">
                  <th className="px-4 py-3" onClick={() => requestSort("name")}>
                    Player
                  </th>
                  <th className="px-4 py-3" onClick={() => requestSort("pos")}>
                    Pos
                  </th>
                  <th className="px-4 py-3" onClick={() => requestSort("team")}>
                    Team
                  </th>
                  <th
                    className="px-4 py-3 text-right"
                    onClick={() => requestSort("points")}
                  >
                    Pts
                  </th>
                  <th
                    className="px-4 py-3 text-right"
                    onClick={() => requestSort("salary")}
                  >
                    Salary
                  </th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedPool.map((player) => {
                  const isSelected = lineup.find((p) => p.id === player.id);
                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? "opacity-30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-black text-xs uppercase">
                        {player.name}
                      </td>
                      <td className="px-4 py-3 text-[10px] font-bold text-slate-400">
                        {player.pos}
                      </td>
                      <td className="px-4 py-3 text-[10px] font-bold text-slate-400">
                        {player.team}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                        {player.points.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                        ${formatSalary(player.salary)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => addToLineup(player)}
                          disabled={isSelected}
                          className="text-[9px] font-black uppercase px-4 py-1.5 border border-black hover:bg-black hover:text-white disabled:opacity-0"
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

function SlotCard({ player, label, onRemove }: any) {
  return (
    <div
      className={`w-28 h-28 border-2 transition-all flex flex-col items-center justify-center p-2 relative ${
        player
          ? "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          : "border-dashed border-slate-200 bg-slate-50/30"
      }`}
    >
      {player ? (
        <>
          <span className="text-[7px] font-black text-slate-300 absolute top-2 left-2">
            {label}
          </span>
          <span className="text-[10px] font-black text-center uppercase leading-tight mb-1">
            {player.name.split(" ").pop()}
          </span>
          <span className="text-[14px] font-black text-slate-900 uppercase tracking-tighter">
            {player.team}
          </span>
          <button
            onClick={() => onRemove(player.id)}
            className="absolute -top-2 -right-2 bg-black text-white w-6 h-6 text-[10px] flex items-center justify-center hover:bg-rose-600 transition-colors"
          >
            ×
          </button>
        </>
      ) : (
        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
}
