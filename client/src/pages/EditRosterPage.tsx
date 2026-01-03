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

  const processedPool = useMemo(() => {
    let result = PLAYER_POOL.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPos = posFilter === "ALL" || (posFilter === "FORWARDS" ? p.pos === "F" : p.pos === posFilter);
      const matchesTeam = teamFilter === "ALL" || p.team === teamFilter;
      return matchesSearch && matchesPos && matchesTeam;
    });

    result.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [searchTerm, posFilter, teamFilter, sortConfig]);

  return (
    <div className="flex bg-slate-50 text-slate-900">
      <Sidebar onLogout={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden ml-16">
        {/* TACTICAL FORMATION VIEW */}
        <section className="flex flex-col bg-white border-b border-slate-300 shadow-sm z-10 overflow-y-auto max-h-[60%]">
          <div className="px-8 py-6 bg-slate-900 flex justify-between items-center sticky top-0 z-20">
            <div>
              <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                Roster <span className="text-slate-500">Editor</span>
              </h1>
              <div className="mt-2 flex gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-500">Total Salary</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">${formatSalary(totalSalary)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-slate-500">Remaining Slots</p>
                  <p className="text-sm font-mono font-bold text-white">{6 - lineup.length} / 6</p>
                </div>
              </div>
            </div>
            <button className="bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              Save Lineup
            </button>
          </div>

          <div className="p-8 flex flex-col gap-6 bg-slate-50/50">
            {/* ROW 1: FORWARDS */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <FormationCard 
                  key={`f-${i}`} 
                  player={lineup.filter(p => p.pos === "F")[i]} 
                  label="FWD" 
                  onRemove={removeFromLineup} 
                />
              ))}
            </div>

            {/* ROW 2: DEFENSE */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
              {[...Array(2)].map((_, i) => (
                <FormationCard 
                  key={`d-${i}`} 
                  player={lineup.filter(p => p.pos === "D")[i]} 
                  label="DEF" 
                  onRemove={removeFromLineup} 
                />
              ))}
            </div>

            {/* ROW 3: GOALIE */}
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs mx-auto">
              <FormationCard 
                player={lineup.find(p => p.pos === "G")} 
                label="GOALIE" 
                onRemove={removeFromLineup} 
                isGoalie 
              />
            </div>
          </div>
        </section>

        {/* PLAYER POOL TABLE */}
        <section className="flex-1 overflow-hidden flex flex-col p-8 bg-white">
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase">Search</span>
              <input
                type="text"
                placeholder="PLAYER NAME..."
                className="bg-slate-50 border border-slate-200 text-[10px] py-2.5 px-4 font-bold uppercase w-64 outline-none focus:border-black"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase">Position</span>
              <select
                className="bg-slate-50 border border-slate-200 text-[10px] py-2.5 px-4 font-bold uppercase outline-none min-w-[120px]"
                onChange={(e) => setPosFilter(e.target.value)}
              >
                <option value="ALL">ALL POS</option>
                <option value="FORWARDS">FORWARDS</option>
                <option value="D">DEFENCE</option>
                <option value="G">GOALIE</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase">Team</span>
              <select
                className="bg-slate-50 border border-slate-200 text-[10px] py-2.5 px-4 font-bold uppercase outline-none min-w-[120px]"
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                {teamsList.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              </div>
            </div>

          <div className="flex-1 overflow-auto border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900 text-white z-20">
                <tr className="text-[9px] font-black uppercase tracking-widest cursor-pointer">
                  <th className="px-6 py-4" onClick={() => requestSort("name")}>Player</th>
                  <th className="px-6 py-4" onClick={() => requestSort("pos")}>Pos</th>
                  <th className="px-6 py-4" onClick={() => requestSort("team")}>Team</th>
                  <th className="px-6 py-4 text-right" onClick={() => requestSort("points")}>Pts</th>
                  <th className="px-6 py-4 text-right" onClick={() => requestSort("salary")}>Salary</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedPool.map((player) => {
                  const isSelected = lineup.find((p) => p.id === player.id);
                  return (
                    <tr key={player.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? "opacity-30" : ""}`}>
                      <td className="px-6 py-4 font-black text-xs uppercase">{player.name}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{player.pos}</td>
                      <td style={{ color: player.color }} className="px-6 py-4 text-[10px] font-bold text-slate-400">{player.team}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold">{player.points.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900">${formatSalary(player.salary)}</td>
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

function FormationCard({ player, label, onRemove, isGoalie }: { player?: any; label: string; onRemove: any; isGoalie?: boolean }) {
  if (!player) {
    return (
      <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-6 min-h-[120px]">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
      </div>
    );
  }

  const pts = player.points;
  let pointColor = "text-slate-400";
  if (pts > 0) pointColor = "text-emerald-600 font-bold";
  if (pts < 0) pointColor = "text-rose-600 font-bold";

  console.log(player);

  const playerColor = player.color || "#000000ff";

  return (
    <div className="bg-white border border-slate-200 flex flex-col shadow-sm transition-all hover:border-slate-400 group relative">
      <div style={{ backgroundColor: playerColor }} className="h-1.5 w-full" />

      <button
        onClick={() => onRemove(player.id)}
        className="absolute -top-2 -right-2 bg-black text-white w-6 h-6 text-[10px] flex items-center justify-center hover:bg-rose-600 transition-colors z-30 shadow-md"
      >
        ×
      </button>
      <div className="p-4 flex flex-col items-center text-center gap-1">
        <span style={{ color: playerColor }} className="font-bold text-[9px] uppercase tracking-tighter">
          {player.team || player.abbrev}
        </span>
        
        <h3 className={`font-black text-slate-800 uppercase leading-tight ${isGoalie ? 'text-base' : 'text-[12px]'}`}>
          {player.name.split(' ').pop()}
        </h3>

        <div className={`font-mono mt-1 ${pointColor} ${isGoalie ? 'text-lg' : 'text-xs'}`}>
          {pts > 0 ? `+${pts.toFixed(1)}` : pts.toFixed(1)}
        </div>

        {/* Salary Integration */}
        <div className="mt-2 pt-2 border-t border-slate-300 w-full">
          <span className=" text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
            ${(player.salary).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}