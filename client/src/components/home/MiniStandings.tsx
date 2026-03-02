import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function MiniStandings({ leagueId, teamId }: { leagueId?: number, teamId?: number }) {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;

    const fetchMiniStandings = async () => {
      try {
        const res = await api.get(`/leagues/${leagueId}/standings/with-last-night`);
        if (res.data.ok) {
          console.log("res.data.standings", res.data.standings);
          const mappedData = res.data.standings.map((t: any) => ({
            rank: parseInt(t.rank),
            name: t.team_name,
            points: t.period_points,
            lastNightPoints: t.last_night_points,
            isUser: t.team_id === teamId,
          }));
          console.log("mappedData", mappedData);
          setStandings(mappedData);
        }
        } catch (err) {
          console.error("Error fetching mini standings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMiniStandings();
  }, [leagueId, teamId]);

  if (!leagueId) {
    return (
      <div className="bg-bg-primary border-2 border-dashed border-border-default p-6 text-center">
        <p className="text-xs font-black text-text-muted-subtle uppercase italic">
          No League Assigned
        </p>
        <button 
           onClick={() => navigate("/league")}
           className="mt-2 text-[10px] bg-bg-sidebar text-text-inverse px-3 py-1 uppercase font-bold"
        >
          Join a League
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-bg-primary border border-border-strong p-4 font-black italic text-text-muted-subtle animate-pulse">
        LOADING STANDINGS...
      </div>
    );
  }

  if (standings.length === 0) return null;

  const userIndex = standings.findIndex((t) => t.isUser);
  const leader = standings[0];

  const formatPoints = (points: number, lastNightPoints: number | null) => {
    const total = Number(points).toFixed(1);
    const lastNight =
      lastNightPoints != null && Number(lastNightPoints) > 0
        ? Number(lastNightPoints).toFixed(1)
        : null;
    return lastNight !== null ? `${total} (${lastNight})` : `${total} (-)`;
  };
  
  const displayIndex = userIndex === -1 ? 0 : userIndex;

  const neighbors = standings.slice(
    Math.max(0, displayIndex - 1),
    Math.min(standings.length, displayIndex + 2)
  );

  const showLeaderSeparately = !neighbors.find(n => n.rank === 1);

  return (
    <div className="bg-bg-primary border border-border-strong overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-3 bg-bg-sidebar flex justify-between items-center">
        <h2 className="text-xs font-black text-text-inverse uppercase tracking-widest">
          League Standings
        </h2>
        <span className="text-[9px] text-text-muted-subtle font-bold uppercase">ID: #{leagueId}</span>
      </div>

      <div className="flex flex-col">
        {showLeaderSeparately && (
          <>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-text-secondary bg-bg-secondary/50">
              <div className="flex items-center gap-3">
                <span className="font-mono w-4 text-accent-warning font-bold">01</span>
                <span className="font-bold tracking-tight uppercase">{leader.name}</span>
              </div>
              <div className="font-mono text-text-muted-subtle">
                {formatPoints(leader.points, leader.lastNightPoints)}
              </div>
            </div>
            <div className="h-[1px] bg-bg-tertiary mx-4 flex justify-center relative">
              <span className="bg-bg-primary px-2 absolute -top-1.5 text-[8px] text-text-muted-subtle italic font-bold">GAP</span>
            </div>
          </>
        )}

        {neighbors.map((team) => (
          <div
            key={team.rank}
            className={`flex items-center justify-between px-4 py-3 text-[11px] ${
              team.isUser
                ? "text-accent-primary bg-bg-secondary font-bold border-l-4 border-accent-primary"
                : "text-text-secondary border-t border-border-subtle"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`font-mono w-4 ${team.isUser ? "text-accent-primary" : "text-text-muted-subtle"}`}>
                {team.rank.toString().padStart(2, "0")}
              </span>
              <span className="font-black tracking-tight uppercase">{team.name}</span>
            </div>
            <div className="font-mono font-bold">{formatPoints(team.points, team.lastNightPoints)}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-secondary px-4 py-2 border-t border-border-default">
        <button 
          onClick={() => navigate("/league")} 
          className="w-full text-[9px] font-black text-text-muted uppercase hover:text-text-primary transition-colors"
        >
          Show Full Rankings
        </button>
      </div>
    </div>
  );
}