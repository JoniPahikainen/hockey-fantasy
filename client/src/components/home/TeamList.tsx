import { useNavigate } from "react-router-dom";

export default function TeamList({ team }: { team: any[] }) {
  const navigate = useNavigate();

  if (team.length === 0) {
    return (
      <div className="bg-bg-primary border-2 border-dashed border-border-default p-6 text-center">
        <p className="text-xs font-black text-text-muted-subtle uppercase italic">
          No Team Built Yet
        </p>
        <button 
           onClick={() => navigate("/team")}
            className="mt-2 text-[10px] bg-bg-sidebar text-text-inverse px-3 py-1 uppercase font-bold"
        >
          Build Your Team
        </button>
      </div>
    );
  }

  const postion: Record<string, number> = {
    'F': 1,
    'D': 2,
    'G': 3
  };
  
  const sortedTeam = [...team].sort((a, b) => {
    const weightA = postion[a.pos] || 99;
    const weightB = postion[b.pos] || 99;
    return weightA - weightB;
  });

  return (
    <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-bg-sidebar flex justify-between items-center">
        <h2 className="text-xs font-black text-text-inverse uppercase tracking-[0.2em]">
          My Team
        </h2>
      </div>
      <div className="flex flex-col divide-y divide-border-default">
        {sortedTeam.map((player) => {
          const isCaptain = Boolean(player.is_captain);
          const rawPoints = Number(player.points || 0);
          const displayPoints = Math.round(isCaptain ? rawPoints * 1.3 : rawPoints);
          const pointsColor =
            displayPoints < 0
              ? "text-accent-danger"
              : displayPoints > 0
                ? "text-accent-success"
                : "text-text-muted";

          return (
            <div
              key={player.player_id || player.id || player.name}
              className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary cursor-pointer group transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  style={{ backgroundColor: player.color }}
                  className="h-10 w-10 flex items-center justify-center border-r-4 border-border-strong/20 font-black text-text-inverse text-[10px]"
                >
                  {player.abbrev}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-text-muted-subtle w-4">
                    {player.pos}
                  </span>
                  <span
                    className={`text-sm font-bold uppercase ${
                      isCaptain ? "text-accent-primary" : "text-text-secondary"
                    }`}
                  >
                    {player.name}
                  </span>
                  {isCaptain && (
                    <span
                      className="text-[8px] font-black uppercase tracking-wider bg-accent-primary text-text-inverse px-1.5 py-0.5 rounded-sm"
                      title="Captain (1.3× points)"
                    >
                      C
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <div className={`text-sm font-mono font-black ${pointsColor}`}>
                  {displayPoints > 0 ? `+${displayPoints}` : displayPoints}
                </div>
                {isCaptain && (
                  <span className="text-[8px] font-bold text-text-muted-subtle uppercase tracking-tighter">
                    ×1.3
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-bg-secondary px-4 py-2 border-t border-border-default">
        <button
          onClick={() => navigate("/team")}
          className="w-full text-[9px] font-black text-text-muted uppercase hover:text-text-primary"
        >
          Edit Team
        </button>
      </div>
    </div>
  );
}
