import { useNavigate } from "react-router-dom";

export default function RosterList({ team }: { team: any[] }) {
  const navigate = useNavigate();

    return (
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">My Team</h2>
        </div>
        <div className="flex flex-col divide-y divide-slate-200">
          {team.map((player) => (
            <div key={player.name} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer group transition-colors">
              <div className="flex items-center space-x-3">
                <div style={{ backgroundColor: player.color }} className="h-10 w-10 flex items-center justify-center border-r-4 border-black/20 font-black text-white text-[10px]">{player.abbrev}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-slate-400 w-4">{player.pos}</span>
                  <span className="text-sm font-bold text-slate-800 uppercase">{player.name}</span>
                </div>
              </div>
              <div className="text-sm font-mono font-black">{player.points.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
        <button onClick={() => navigate("/daily-roster")} className="w-full text-[9px] font-black text-slate-500 uppercase hover:text-slate-900">
          Edit Roster
        </button>
      </div>
      </div>
    );
  }