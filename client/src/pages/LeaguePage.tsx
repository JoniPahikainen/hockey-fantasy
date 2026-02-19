import { useState, useEffect, Fragment } from "react";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";
import { LEAGUE_RECORDS, LEAGUE_PERIODS } from "../data/mockData";
import LeagueSetupPage from "./LeagueSetupPage";
import TeamPerformanceGraph from "../components/league/TeamPerformanceGraph";
import { useActiveTeam } from "../context/ActiveTeamContext";

export default function LeagueStandingsPage() {
  const [activePeriod, setActivePeriod] = useState<number>(1);
  const [standings, setStandings] = useState<any[]>([]);
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  const [hasCheckedLeague, setHasCheckedLeague] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const { activeTeamId } = useActiveTeam();

  const userStr = localStorage.getItem("user");
  const userId = userStr ? JSON.parse(userStr).id : null;
  const isFullSeason = activePeriod === 6;

  const toggleTeam = (teamId: number) => {
  setExpandedTeamId(prev => (prev === teamId ? null : teamId));
};

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data } = await api.get("/leagues/current-period");
        if (data.ok) {
          setCurrentPeriod(data.period.period_id);
          setActivePeriod(data.period.period_id);
        }
      } catch (err) {
        console.error("Error fetching current period:", err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchUserLeagues = async () => {
      if (!userId) return;

      try {
        const { data } = await api.get(`/leagues/user/${userId}`);
        if (data.ok && Array.isArray(data.leagues)) {
          let leagues = data.leagues as any[];

          if (activeTeamId) {
            leagues = leagues.filter((l) => l.team_id === activeTeamId);
          }

          setUserLeagues(leagues);
          setSelectedLeagueId(leagues.length ? leagues[0].league_id : null);
        }
      } catch (err) {
        console.error("Error fetching user leagues:", err);
      } finally {
        setHasCheckedLeague(true);
      }
    };

    fetchUserLeagues();
  }, [userId, activeTeamId]);


  useEffect(() => {
    if (!selectedLeagueId) return;

    const fetchStandings = async () => {
      try {
        const endpoint = isFullSeason
          ? `/leagues/${selectedLeagueId}/standings`
          : `/leagues/${selectedLeagueId}/standings/period/${activePeriod}`;

        const { data } = await api.get(endpoint);

        if (data.ok) {
          const mappedData = data.standings.map((s: any) => ({
            teamId: s.team_id,
            rank: parseInt(s.rank),
            previousRank: parseInt(s.rank),
            name: s.team_name,
            manager: s.owner_name,
            points: isFullSeason ? s.total_points : s.period_points,
            lastDayPoints: 0,
            isUser: false,
          }));
          setStandings(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch standings:", err);
      }
    };

    fetchStandings();
  }, [activePeriod, isFullSeason, selectedLeagueId]);

  const getMovement = (curr: number, prev: number) => {
    if (curr < prev) return <span className="text-emerald-500">▲</span>;
    if (curr > prev) return <span className="text-rose-500">▼</span>;
    return <span className="text-slate-300 text-[8px]">●</span>;
  };

  if (!hasCheckedLeague) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        Loading...
      </div>
    );
  }

  if (userLeagues.length === 0) {
    return <LeagueSetupPage />;
  }

  const handleLeaveLeague = async () => {
    if (!selectedLeagueId || !selectedLeague) return;

    try {
      const { data } = await api.post(
        `/leagues/${selectedLeagueId}/leave`,
        { team_id: selectedLeague.team_id }
      );

      if (data.ok) {
        const updated = userLeagues.filter(
          (l) => l.league_id !== selectedLeagueId
        );

        setUserLeagues(updated);
        setSelectedLeagueId(updated.length ? updated[0].league_id : null);
      }
    } catch (err) {
      console.error("Failed to leave league:", err);
    }
  };

  const selectedLeague = userLeagues.find(
    (league) => league.league_id === selectedLeagueId
  );




  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-6">
          
          {/* LEFT SIDE */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                {selectedLeague?.name || "League"} Standings
              </h1>
              <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">
                {isFullSeason ? "Overall Rankings" : `Period ${activePeriod}`}
              </p>
            </div>

            {userLeagues.length > 1 && (
              <select
                value={selectedLeagueId || ""}
                onChange={(e) => setSelectedLeagueId(Number(e.target.value))}
                className="w-64 bg-white border border-slate-300 px-3 py-2 text-xs font-bold uppercase"
              >
                {userLeagues.map((league) => (
                  <option key={league.league_id} value={league.league_id}>
                    {league.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-start lg:items-end gap-3">
            <div className="bg-slate-100 border border-slate-300 px-4 py-2">
              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-widest">
                League ID
              </span>
              <span className="font-mono font-black text-sm text-slate-900">
                {selectedLeagueId}
              </span>
            </div>

            <button
              onClick={handleLeaveLeague}
              className="bg-rose-600 text-white text-[9px] font-black uppercase px-3 py-2 hover:bg-rose-700 transition-colors"
            >
              Leave League
            </button>
          </div>

        </header>


        <main className="max-w-7xl mx-auto space-y-8">
          <div className="flex gap-1 border-b border-slate-200 pb-4 overflow-x-auto">
            {LEAGUE_PERIODS.map((p) => {
              const isActive = activePeriod === p.id;
              const isLocked =
                currentPeriod !== null && p.id !== 6 && p.id > currentPeriod;
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
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400">
                      Team / Manager
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 text-right">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {standings.map((team) => (
                    <Fragment key={team.teamId}>
                      <tr
                        onClick={() => toggleTeam(team.teamId)}
                        className={`cursor-pointer transition-colors group ${
                          expandedTeamId === team.teamId ? "bg-slate-100" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-lg">{team.rank}</span>
                            <span className="text-[8px]">{getMovement(team.rank, team.previousRank)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {team.name} {expandedTeamId === team.teamId ? '▴' : '▾'}
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
                      
                      {/* THE GRAPH SECTION */}
                      {expandedTeamId === team.teamId && (
                        <tr>
                          <td colSpan={3} className="p-0 border-b border-slate-300">
                            <TeamPerformanceGraph 
                              teamId={team.teamId} 
                              periodId={activePeriod} 
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          <div
            key={i}
            className="flex justify-between items-center px-4 py-3 hover:bg-slate-50"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400">
                {row.label}
              </span>
              <span className="text-xs font-bold uppercase text-slate-800">
                {row.team}
              </span>
            </div>
            <span className={`font-mono font-black text-sm ${accent}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
