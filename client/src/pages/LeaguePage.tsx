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
            lastNightPoints: s.last_night_points != null ? Number(s.last_night_points) : 0,
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
    if (curr < prev) return <span className="text-accent-success">▲</span>;
    if (curr > prev) return <span className="text-accent-danger">▼</span>;
    return <span className="text-text-muted-subtle text-[8px]">●</span>;
  };

  if (!hasCheckedLeague) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-secondary">
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
    <div className="flex h-screen bg-bg-secondary text-text-primary">
      <Sidebar />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-6">
          
          {/* LEFT SIDE */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                {selectedLeague?.name || "League"} Standings
              </h1>
              <p className="text-text-muted font-medium tracking-tight uppercase text-xs">
                {isFullSeason ? "Overall Rankings" : `Period ${activePeriod}`}
              </p>
            </div>

            {userLeagues.length > 1 && (
              <select
                value={selectedLeagueId || ""}
                onChange={(e) => setSelectedLeagueId(Number(e.target.value))}
                className="w-64 bg-bg-primary border border-border-input px-3 py-2 text-xs font-bold uppercase"
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
            <div className="bg-bg-tertiary border border-border-input px-4 py-2">
              <span className="block text-[9px] font-black uppercase text-text-muted-subtle tracking-widest">
                League ID
              </span>
              <span className="font-mono font-black text-sm text-text-primary">
                {selectedLeagueId}
              </span>
            </div>

            <button
              onClick={handleLeaveLeague}
              className="bg-accent-danger text-text-inverse text-[9px] font-black uppercase px-3 py-2 hover:bg-accent-danger-hover transition-colors"
            >
              Leave League
            </button>
          </div>

        </header>


        <main className="max-w-7xl mx-auto space-y-8">
          <div className="flex gap-1 border-b border-border-default pb-4 overflow-x-auto">
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
                    ${isActive ? "bg-bg-sidebar text-text-inverse" : "text-text-muted-subtle hover:text-text-primary"}
                    ${isLocked ? "opacity-20 cursor-not-allowed" : ""}
                  `}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-bg-sidebar flex justify-between items-center">
              <h2 className="text-xs font-black text-text-inverse uppercase tracking-[0.2em]">
                Rankings
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-default bg-bg-secondary">
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle">
                      Team
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle text-center w-28">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {standings.map((team) => (
                    <Fragment key={team.teamId}>
                      <tr
                        onClick={() => toggleTeam(team.teamId)}
                        className={`cursor-pointer transition-colors group ${
                          expandedTeamId === team.teamId ? "bg-bg-tertiary" : "hover:bg-bg-secondary"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-black font-black text-lg">{team.rank}</span>
                            <span className="text-[8px]">{getMovement(team.rank, team.previousRank)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black uppercase text-text-secondary group-hover:text-accent-primary transition-colors">
                            {team.name} {expandedTeamId === team.teamId ? '▴' : '▾'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black uppercase text-text-secondary">
                            {team.manager}
                          </span>
                        </td>
                        <td className="px-6 py-4 w-28 text-center">
                          {isFullSeason ? (
                            <span className="text-sm font-black text-text-primary">
                              {Number(team.points || 0).toFixed(1)}
                            </span>
                          ) : (
                            <span className="inline-flex items-baseline justify-center gap-1">
                              <span className="font-black text-text-primary">
                                {Number(team.points ?? 0).toFixed(0)}
                              </span>
                              <span className="font-black text-sm text-text-muted-subtle">
                                ({Number(team.lastNightPoints || 0).toFixed(1)})
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* THE GRAPH SECTION */}
                      {expandedTeamId === team.teamId && (
                        <tr>
                          <td colSpan={4} className="p-0 border-b border-border-input">
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
              accent="text-accent-primary"
            />
            <RecordTable
              title="Season Records"
              data={LEAGUE_RECORDS.seasonBest}
              accent="text-accent-warning"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function RecordTable({ title, data, accent }: any) {
  return (
    <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-bg-tertiary border-b border-border-default">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
          {title}
        </h3>
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {data.map((row: any, i: number) => (
          <div
            key={i}
            className="flex justify-between items-center px-4 py-3 hover:bg-bg-secondary"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-text-muted-subtle">
                {row.label}
              </span>
              <span className="text-xs font-bold uppercase text-text-secondary">
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
