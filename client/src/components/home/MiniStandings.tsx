import { useNavigate } from "react-router-dom";

export default function MiniStandings({ team_data }: { team_data: any[] }) {
  const navigate = useNavigate();
  const userIndex = team_data.findIndex((t) => t.isUser);
  const leader = team_data[0];
  const neighbors = team_data.slice(
    Math.max(1, userIndex - 1),
    Math.min(team_data.length, userIndex + 2)
  );

  if (userIndex === 0) {
    neighbors.unshift(team_data[1], team_data[2]);
  }

  return (
    <div className="bg-white border border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
        <h2 className="text-xs font-black text-white uppercase tracking-widest">
          League Standings
        </h2>
      </div>

      <div className="flex flex-col">
        {/* LEADER ROW (Always Rank 1) */}
        {!leader.isUser && (
          <>
            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-slate-600 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="font-mono w-4 text-amber-500 font-bold">
                  01
                </span>
                <span className="font-bold tracking-tight uppercase">
                  {leader.name}
                </span>
              </div>
              <div className="font-mono text-slate-400">{leader.points}</div>
            </div>
            {userIndex > 2 && (
              <div className="h-[1px] bg-slate-100 mx-4 flex justify-center">
                <span className="bg-white px-2 -mt-1.5 text-[8px] text-slate-300 italic font-bold">
                  GAP
                </span>
              </div>
            )}
          </>
        )}

        {/* NEIGHBORS + USER */}
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
              <span
                className={`font-mono w-4 ${
                  team.isUser ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {team.rank.toString().padStart(2, "0")}
              </span>
              <span className="font-black tracking-tight uppercase">
                {team.name}
              </span>
            </div>
            <div className="font-mono font-bold">{team.points}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
        <button onClick={() => navigate("/league")} className="w-full text-[9px] font-black text-slate-500 uppercase hover:text-slate-900">
          Show Full Rankings
        </button>
      </div>
    </div>
  );
}
