export default function BestPerformers({ team }: { team: any[] }) {
  const safeTeam = Array.isArray(team) ? team : [];

  const forwards = safeTeam.filter((p) => p.pos === "F");
  const defense = safeTeam.filter((p) => p.pos === "D");
  const goalie = safeTeam.filter((p) => p.pos === "G");

  const totalPoints = safeTeam.reduce((sum, p) => {
    const val = parseFloat(p.points) || 0;
    return sum + val;
  }, 0);

  return (
    <div className="bg-white border border-slate-300 shadow-sm w-full">
      <div className="px-6 py-4 bg-slate-900 flex justify-between items-center">
        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
          Optimal <span className="text-slate-400">Lineup</span>
        </h2>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase block leading-none mb-1">
            Total FP
          </span>
          <span className="text-lg font-mono font-black text-white leading-none">
            {totalPoints.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4 bg-slate-50/30">
        <div className="grid grid-cols-3 gap-4 w-full">
          {forwards.map((p) => (
            <FormationCard key={p.name} player={p} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
          {defense.map((p) => (
            <FormationCard key={p.name} player={p} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-xl mx-auto">
          {goalie.map((p) => (
            <FormationCard key={p.name} player={p} isGoalie />
          ))}
        </div>
      </div>

      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-center gap-8">
        <LegendItem color="bg-emerald-500" label="Gain" />
        <LegendItem color="bg-rose-500" label="Loss" />
        <LegendItem color="bg-slate-300" label="Even" />
      </div>
    </div>
  );
}

function FormationCard({
  player,
  isGoalie,
}: {
  player: any;
  isGoalie?: boolean;
}) {
  const pts = parseFloat(player.points);

  const getBreakdown = () => {
    const isWin = player.is_win === true || player.is_win === "true";
    const resultPts = isWin ? 4 : -2;
    const resultLabel = isWin ? "Win" : "Loss";

    const goalVal = player.pos === "D" ? 9 : 7;
    const assistVal = player.pos === "D" ? 6 : 4;

    let lines = [];

    if (isGoalie) {
      lines.push({
        label: "Saves",
        count: player.saves,
        pts: parseFloat(player.points) - resultPts,
      });
    } else {
      lines.push({
        label: "Goals",
        count: player.goals,
        pts: (player.goals || 0) * goalVal,
      });
      lines.push({
        label: "Assists",
        count: player.assists,
        pts: (player.assists || 0) * assistVal,
      });
    }

    lines.push({ label: resultLabel, count: 1, pts: resultPts });

    return lines.filter((item) => item.label === resultLabel || item.pts !== 0);
  };

  return (
    <div className="group relative bg-white border border-slate-200 flex flex-col shadow-sm transition-all hover:border-slate-400">
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 hidden group-hover:block z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="bg-slate-900 rounded-lg p-3 shadow-2xl border border-slate-700">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">
            Point Breakdown
          </p>
          <div className="space-y-1.5">
            {getBreakdown().map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-[10px] font-mono"
              >
                <span className="text-slate-400">
                  {item.label === "Win" || item.label === "Loss"
                    ? item.label
                    : `${item.count}x ${item.label}`}
                </span>

                <span
                  className={
                    item.pts >= 0
                      ? "text-emerald-400 font-bold"
                      : "text-rose-400 font-bold"
                  }>
                  {item.pts > 0 ? `+${item.pts}` : item.pts}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
        </div>
      </div>

      <div style={{ backgroundColor: player.color }} className="h-1.5 w-full" />

      <div className="p-4 lg:p-6 flex flex-col items-center text-center gap-1">
        <span
          style={{ color: player.color }}
          className="font-bold text-[10px] uppercase tracking-tighter"
        >
          {player.abbrev}
        </span>
        <h3 className="font-black text-slate-800 uppercase leading-tight text-[11px] lg:text-sm">
          {player.name.split(" ").pop()}
        </h3>
        <div
          className={`font-mono mt-1 ${pts > 0 ? "text-emerald-600" : "text-rose-600"} font-bold`}
        >
          {pts > 0 ? `+${pts.toFixed(1)}` : pts.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 ${color}`} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
