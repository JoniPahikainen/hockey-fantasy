import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
{/* import Calender from "../components/home/Calender"; */}
import TeamList from "../components/home/TeamList";
import UpcomingMatches, { type UpcomingMatchesProps } from "../components/home/UpcomingMatches";
import MiniStandings from "../components/home/MiniStandings";
import BestPerformers from "../components/home/BestPerformers";
import api from "../lib/api";
import { useActiveTeam } from "../context/ActiveTeamContext";

export default function HomePage() {
  const [userName, setUserName] = useState("Team Manager");
  const [userTeam, setUserTeam] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [nextGamesDateMatches, setNextGamesDateMatches] = useState<any[]>([]);
  const [nextGamesDateLabel, setNextGamesDateLabel] = useState<string>("");
  const [optimalLineup, setOptimalLineup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState<{ leagueId?: number; teamId?: number }>({});
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const { activeTeamId } = useActiveTeam();

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);
    setUserName(user.username || "Team Manager");
    const userId = user.id;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setNextGamesDateMatches([]);
          setNextGamesDateLabel("");
          setLeagueName(null);

        const [matchRes, optimalRes, leaguesRes] = await Promise.all([
          api.get(`/matches/${todayStr}`),
          api.get(`/fantasy-teams/optimal-lineups`),
          api.get(`/leagues/user/${userId}`),
        ]);

        if (matchRes.data.ok) {
          const todayMatches = matchRes.data.matches ?? [];
          setMatches(todayMatches);

          if (todayMatches.length === 0) {
            const maxDaysToCheck = 60;
            for (let offset = 1; offset <= maxDaysToCheck; offset++) {
              const next = new Date(todayStr);
              next.setDate(next.getDate() + offset);
              const nextStr = next.toISOString().split("T")[0];
              try {
                const nextRes = await api.get(`/matches/${nextStr}`);
                if (nextRes.data.ok && Array.isArray(nextRes.data.matches) && nextRes.data.matches.length > 0) {
                  setNextGamesDateMatches(nextRes.data.matches);
                  setNextGamesDateLabel(next.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
                  break;
                }
              } catch {
                // continue to next day
              }
            }
          }
        }

        if (optimalRes.data.ok) {
          setOptimalLineup(optimalRes.data.best || []);
        }

        if (activeTeamId) {
          try {
            const teamPlayersRes = await api.get(
              `/fantasy-teams/${activeTeamId}/players`,
            );
            if (teamPlayersRes.data.ok) {
              setUserTeam(teamPlayersRes.data.players);
            }
          } catch (err) {
            console.error("Failed to load active team players:", err);
          }

          let leagueIdForTeam: number | undefined = undefined;
          if (leaguesRes.data.ok && Array.isArray(leaguesRes.data.leagues)) {
            const league = (leaguesRes.data.leagues as any[]).find(
              (l) => l.team_id === activeTeamId,
            );
            if (league) {
              leagueIdForTeam = league.league_id;
              setLeagueName(league.name ?? null);
            }
          }

          setTeamInfo({ leagueId: leagueIdForTeam, teamId: activeTeamId });
        } else {
          try {
            const dashRes = await api.get(
              `/fantasy-teams/user-dashboard/${userId}`,
            );
            if (dashRes.data.ok && dashRes.data.team) {
              setUserTeam(dashRes.data.team.players);
              setTeamInfo({
                leagueId: dashRes.data.team.league_id,
                teamId: dashRes.data.team.id,
              });
            }
          } catch (err) {
            console.error("Dashboard Load Error (fallback):", err);
          }
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [todayStr, activeTeamId]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        {/* HEADER SECTION */}
        <header className="flex flex-col lg:flex-row lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              Welcome, {userName}!
            </h1>
            <p className="text-slate-500 font-medium tracking-tight">
              GM DASHBOARD // SEASON STATS
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              placeholder="Search"
              className="border border-slate-300 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none"
            />
            <div className="w-10 h-10 bg-slate-900 shadow-lg" />
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-9 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <BestPerformers team={optimalLineup} />
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {loading ? (
              <div className="p-4 bg-white border border-slate-900 italic">
                Loading tonight's action...
              </div>
            ) : (
              <UpcomingMatches
                {...({
                  match_data: matches,
                  nextGamesMatches: nextGamesDateMatches,
                  nextGamesLabel: nextGamesDateLabel,
                } satisfies UpcomingMatchesProps)}
              />
            )}
            <MiniStandings leagueId={teamInfo.leagueId} teamId={teamInfo.teamId} />
            <TeamList team={userTeam} />
          </div>
        </div>
      </div>
    </div>
  );
}
