import { useState, useEffect } from "react";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";
import LeagueSetupPage from "./LeagueSetupPage";
import { useActiveTeam } from "../context/ActiveTeamContext";
import LeaguePeriodTabs from "../components/league/LeaguePeriodTabs";
import LeagueStandingsTable from "../components/league/LeagueStandingsTable";
import type { StandingsRow } from "../components/league/LeagueStandingsTable";
import RecordTable from "../components/league/RecordTable";

export default function LeagueStandingsPage() {
  const [activePeriod, setActivePeriod] = useState<number>(1);
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  const [hasCheckedLeague, setHasCheckedLeague] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [isCurrentPeriodView, setIsCurrentPeriodView] = useState(false);
  const [matchdayBests, setMatchdayBests] = useState<
    { label: string; team: string; value: number }[]
  >([]);
  const [scopeBests, setScopeBests] = useState<
    { label: string; team: string; value: number }[]
  >([]);
  const { activeTeamId } = useActiveTeam();

  const userStr = localStorage.getItem("user");
  const userId = userStr ? JSON.parse(userStr).id : null;
  const isFullSeason = activePeriod === 6;

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
        const { data } = isFullSeason
          ? await api.get(`/leagues/${selectedLeagueId}/standings`)
          : await api.get(
              `/leagues/${selectedLeagueId}/standings/period/${activePeriod}`,
            );
        if (data.ok) {
          setIsCurrentPeriodView(Boolean(data.is_current_period));
          const mappedData: StandingsRow[] = data.standings.map((s: any) => ({
            teamId: s.team_id,
            rank: parseInt(s.rank),
            previousRank: parseInt(s.rank),
            name: s.team_name,
            manager: s.owner_name,
            points: isFullSeason ? s.total_points : s.period_points,
            lastNightPoints:
              s.last_night_points != null ? Number(s.last_night_points) : 0,
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

  useEffect(() => {
    if (!selectedLeagueId) return;
    const fetchRecords = async () => {
      try {
        const { data } = await api.get(`/leagues/${selectedLeagueId}/records`, {
          params: { period_id: activePeriod },
        });
        if (!data.ok || !Array.isArray(data.records)) return;

        const labelByMetric: Record<string, string> = {
          goals: "Goals",
          points: "Points (G+A)",
          penalties: "Penalties (PIM)",
          fantasy_points: "Fantasy Points",
        };

        const rowsByScope = (scope: "last_night" | "period" | "season") =>
          Object.keys(labelByMetric).map((metric) => {
            const rec = data.records.find(
              (r: any) => r.scope === scope && r.metric === metric,
            );
            return {
              label: labelByMetric[metric],
              team: rec?.team_name ? String(rec.team_name).toUpperCase() : "—",
              value: rec?.value != null ? Math.round(Number(rec.value)) : 0,
            };
          });

        setMatchdayBests(rowsByScope("last_night"));
        setScopeBests(rowsByScope(isFullSeason ? "season" : "period"));
      } catch (err) {
        console.error("Failed to fetch league records:", err);
      }
    };
    fetchRecords();
  }, [selectedLeagueId, activePeriod, isFullSeason]);

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

  const selectedLeague = userLeagues.find(
    (league) => league.league_id === selectedLeagueId
  );

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

  return (
    <div className="flex h-screen bg-bg-secondary text-text-primary">
      <Sidebar />
      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 gap-6">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                {selectedLeague?.name || "League"} Standings
              </h1>
              <p className="text-text-muted font-medium tracking-tight uppercase text-xs">
                {isFullSeason
                  ? "Overall Rankings"
                  : `Period ${activePeriod}${isCurrentPeriodView ? " (Current)" : " (Archived)"}`}
              </p>
            </div>
            {userLeagues.length > 1 && (
              <select
                value={selectedLeagueId ?? ""}
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
          <LeaguePeriodTabs
            activePeriod={activePeriod}
            currentPeriod={currentPeriod}
            onSelectPeriod={setActivePeriod}
          />
          <LeagueStandingsTable
            standings={standings}
            expandedTeamId={expandedTeamId}
            activePeriod={activePeriod}
            isFullSeason={isFullSeason}
            showLastNightPoints={isCurrentPeriodView}
            onToggleTeam={(teamId) =>
              setExpandedTeamId((prev) => (prev === teamId ? null : teamId))
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecordTable
              title="Matchday Bests"
              data={matchdayBests}
              accent="text-accent-primary"
            />
            <RecordTable
              title={isFullSeason ? "Season Best Day" : `Period ${activePeriod} Best Day`}
              data={scopeBests}
              accent="text-accent-warning"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
