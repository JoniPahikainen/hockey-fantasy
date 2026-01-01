import { useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  LEAGUE_RECORDS,
  LEAGUE_PERIODS,
  FULL_SEASON_DATA,
  PERIOD_DATA,
} from "../data/mockData";

const CURRENT_PERIOD = 3;

export default function LeagueStandingsPage() {
  const [activePeriod, setActivePeriod] = useState(CURRENT_PERIOD);

  const isFullSeason = activePeriod === 6;

  const getActiveData = () => {
    const data = isFullSeason
      ? FULL_SEASON_DATA
      : PERIOD_DATA[activePeriod] || [];
    return [...data].sort((a, b) => a.rank - b.rank);
  };

  const displayTeams = getActiveData();

  const getMovement = (curr: number, prev: number) => {
    if (curr < prev) return <span className="text-emerald-500">▲</span>;
    if (curr > prev) return <span className="text-rose-500">▼</span>;
    return <span className="text-slate-300 text-[8px]">●</span>;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar onLogout={() => {}} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-8 bg-white border-b border-slate-200">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            League Standings
          </h1>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* PERIOD SELECTOR */}
            <div className="flex flex-wrap gap-2">
              {LEAGUE_PERIODS.map((p) => {
                const isLocked = p.id !== 6 && p.id > CURRENT_PERIOD;
                const isActive = activePeriod === p.id;

                return (
                  <button
                    key={p.id}
                    disabled={isLocked}
                    onClick={() => setActivePeriod(p.id)}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-2
                      ${
                        isLocked
                          ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60"
                          : ""
                      }
                      ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                          : ""
                      }
                      ${
                        !isActive && !isLocked
                          ? "bg-white border-slate-900 text-slate-900 hover:bg-slate-50"
                          : ""
                      }
                    `}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* RANKINGS TABLE */}
            <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest text-left">
                    <th className="px-6 py-4 w-24">Rank</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4">Manager</th>
                    <th className="px-6 py-4 text-right">
                      {isFullSeason ? "Total Points" : "Points (Last Night)"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayTeams.map((team) => (
                    <tr
                      key={team.name}
                      className={`${
                        team.isUser ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-5 flex items-center gap-4">
                        <span className="font-mono font-black text-xl">
                          {team.rank}
                        </span>
                        <span className="text-[10px]">
                          {getMovement(team.rank, team.previousRank)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`text-sm font-black uppercase tracking-tight ${
                            team.isUser ? "text-indigo-600" : "text-slate-900"
                          }`}
                        >
                          {team.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase italic">
                        {team.manager}
                      </td>
                      <td className="px-6 py-5 text-right font-mono font-black">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-2xl">{team.points}</span>
                          {!isFullSeason && (
                            <span className="text-sm text-slate-400">
                              ({team.lastDayPoints})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LOWER STATS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
              <RecordTable
                title="Latest Matchday Bests"
                data={LEAGUE_RECORDS.lastNight}
                color="border-slate-900"
                accent="text-indigo-600"
              />
              <RecordTable
                title="Season Records"
                data={LEAGUE_RECORDS.seasonBest}
                color="border-amber-500"
                accent="text-amber-600"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function RecordTable({ title, data, color, accent }: any) {
  return (
    <div>
      <h3
        className={`text-lg font-black uppercase italic mb-4 border-b-4 ${color} pb-2`}
      >
        {title}
      </h3>
      <div className="flex flex-col border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        {data.map((row: any, i: number) => (
          <div
            key={i}
            className="flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
          >
            <span className="text-[10px] font-black uppercase text-slate-400 w-24">
              {row.label}
            </span>
            <span className="text-[11px] font-bold uppercase flex-1 px-4 text-slate-700">
              {row.team}
            </span>
            <span className={`font-mono font-black text-sm ${accent}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
