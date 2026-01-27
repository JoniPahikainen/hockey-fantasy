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
        const res = await api.get(`/leagues/${leagueId}/standings/current`);
        if (res.data.ok) {
          const mappedData = res.data.standings.map((t: any) => ({
            rank: parseInt(t.rank),
            name: t.team_name,
            points: t.period_points,
            isUser: t.team_id === teamId,
          }));
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
      <div className="bg-white border-2 border-dashed border-slate-200 p-6 text-center">
        <p className="text-xs font-black text-slate-400 uppercase italic">
          No League Assigned
        </p>
        <button 
           onClick={() => navigate("/league")}
           className="mt-2 text-[10px] bg-slate-900 text-white px-3 py-1 uppercase font-bold"
        >
          Join a League
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-900 p-4 font-black italic text-slate-300 animate-pulse">
        LOADING STANDINGS...
      </div>
    );
  }

  if (standings.length === 0) return null;

  const userIndex = standings.findIndex((t) => t.isUser);
  const leader = standings[0];
  
  const displayIndex = userIndex === -1 ? 0 : userIndex;

  const neighbors = standings.slice(
    Math.max(0, displayIndex - 1),
    Math.min(standings.length, displayIndex + 2)
  );

  const showLeaderSeparately = !neighbors.find(n => n.rank === 1);

  return (
    <div className="bg-white border border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
        <h2 className="text-xs font-black text-white uppercase tracking-widest">
          League Standings
        </h2>
        <span className="text-[9px] text-slate-400 font-bold uppercase">ID: #{leagueId}</span>
      </div>

      <div className="flex flex-col">
        {showLeaderSeparately && (
          <>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="font-mono w-4 text-amber-500 font-bold">01</span>
                <span className="font-bold tracking-tight uppercase">{leader.name}</span>
              </div>
              <div className="font-mono text-slate-400">{leader.points}</div>
            </div>
            <div className="h-[1px] bg-slate-100 mx-4 flex justify-center relative">
              <span className="bg-white px-2 absolute -top-1.5 text-[8px] text-slate-300 italic font-bold">GAP</span>
            </div>
          </>
        )}

        {neighbors.map((team) => (
          <div
            key={team.rank}
            className={`flex items-center justify-between px-4 py-3 text-[11px] ${
              team.isUser
                ? "text-indigo-600 bg-indigo-50 font-bold border-l-4 border-indigo-600"
                : "text-slate-600 border-t border-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`font-mono w-4 ${team.isUser ? "text-indigo-600" : "text-slate-400"}`}>
                {team.rank.toString().padStart(2, "0")}
              </span>
              <span className="font-black tracking-tight uppercase">{team.name}</span>
            </div>
            <div className="font-mono font-bold">{team.points}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
        <button 
          onClick={() => navigate("/league")} 
          className="w-full text-[9px] font-black text-slate-500 uppercase hover:text-slate-900 transition-colors"
        >
          Show Full Rankings
        </button>
      </div>
    </div>
  );
}