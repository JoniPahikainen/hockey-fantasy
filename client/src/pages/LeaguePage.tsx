import { useState, useEffect } from "react";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";
import {
  LEAGUE_RECORDS,
  LEAGUE_PERIODS,
} from "../data/mockData";

const CURRENT_PERIOD = 3;
const LEAGUE_ID = 1;

export default function LeagueStandingsPage() {
  const [activePeriod, setActivePeriod] = useState(CURRENT_PERIOD);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isFullSeason = activePeriod === 6;

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      try {
        const endpoint = isFullSeason
          ? `/leagues/${LEAGUE_ID}/standings`
          : `/leagues/${LEAGUE_ID}/standings/period/${activePeriod}`;
        
        const { data } = await api.get(endpoint);

        if (data.ok) {
          const mappedData = data.standings.map((s: any) => ({
            rank: parseInt(s.rank),
            previousRank: parseInt(s.rank),
            name: s.team_name,
            manager: s.owner_name,
            points: isFullSeason ? s.total_points : s.period_points,
            lastDayPoints: 0, 
            isUser: false
          }));
          setStandings(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch standings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [activePeriod, isFullSeason]);

  const getMovement = (curr: number, prev: number) => {
    if (curr < prev) return <span className="text-emerald-500">▲</span>;
    if (curr > prev) return <span className="text-rose-500">▼</span>;
    return <span className="text-slate-300 text-[8px]">●</span>;
  };

  return (
     <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar onLogout={() => {}} />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="flex flex-col lg:flex-row lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              League Standings
            </h1>
            <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">
              {isFullSeason ? "Overall Rankings" : `Period ${activePeriod}`}
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto space-y-8">
          <div className="flex gap-1 border-b border-slate-200 pb-4 overflow-x-auto">
            {LEAGUE_PERIODS.map((p) => {
              const isActive = activePeriod === p.id;
              const isLocked = p.id !== 6 && p.id > CURRENT_PERIOD;
              return (
                <button
                  key={p.id}
                  disabled={isLocked}
                  onClick={() => setActivePeriod(p.id)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors
                    ${isActive ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"}
                    ${isLocked ? "opacity-20 cursor-not-allowed" : ""}
                  `}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                Rankings
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                Updated Live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Rank</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">Team / Manager</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {standings.map((team) => (
                    <tr key={team.rank} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-lg">{team.rank}</span>
                          <span className="text-[8px]">{getMovement(team.rank, team.previousRank)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {team.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                            {team.manager}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-black text-lg text-slate-900">
                          {Number(team.points || 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecordTable
              title="Matchday Bests"
              data={LEAGUE_RECORDS.lastNight}
              accent="text-indigo-600"
            />
            <RecordTable
              title="Season Records"
              data={LEAGUE_RECORDS.seasonBest}
              accent="text-amber-500"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function RecordTable({ title, data, accent }: any) {
  return (
    <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">
          {title}
        </h3>
      </div>
      <div className="flex flex-col divide-y divide-slate-100">
        {data.map((row: any, i: number) => (
          <div key={i} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400">{row.label}</span>
              <span className="text-xs font-bold uppercase text-slate-800">{row.team}</span>
            </div>
            <span className={`font-mono font-black text-sm ${accent}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}