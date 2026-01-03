export default function BestPerformers({ team }: { team: any[] }) {
  const forwards = team.filter((p) => p.pos === "F");
  const defense = team.filter((p) => p.pos === "D");
  const goalie = team.filter((p) => p.pos === "G");

  const totalPoints = team.reduce((sum, p) => sum + p.points, 0);

  return (
    /* Removed max-w to let it go wide, kept border and style from RosterList */
    <div className="bg-white border border-slate-300 shadow-sm w-full overflow-hidden">
      {/* HEADER */}
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

      {/* FORMATION CONTAINER - Stays 3-2-1 regardless of width */}
      <div className="p-6 flex flex-col gap-4 bg-slate-50/30">
        
        {/* ROW 1: FORWARDS (3) */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {forwards.map((p) => (
            <FormationCard key={p.name} player={p} />
          ))}
        </div>

        {/* ROW 2: DEFENSE (2) - Centered */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
          {defense.map((p) => (
            <FormationCard key={p.name} player={p} />
          ))}
        </div>

        {/* ROW 3: GOALIE (1) - Centered */}
        <div className="grid grid-cols-1 gap-4 w-full max-w-xl mx-auto">
          {goalie.map((p) => (
            <FormationCard key={p.name} player={p} isGoalie />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-center gap-8">
        <LegendItem color="bg-emerald-500" label="Gain" />
        <LegendItem color="bg-rose-500" label="Loss" />
        <LegendItem color="bg-slate-300" label="Even" />
      </div>
    </div>
  );
}

function FormationCard({ player, isGoalie }: { player: any; isGoalie?: boolean }) {
  const pts = player.points;
  let pointColor = "text-slate-400";
  if (pts > 0) pointColor = "text-emerald-600 font-bold";
  if (pts < 0) pointColor = "text-rose-600 font-bold";

  return (
    <div className="bg-white border border-slate-200 flex flex-col shadow-sm transition-all hover:border-slate-400">
      {/* Team Color Strip at Top */}
      <div style={{ backgroundColor: player.color }} className="h-1.5 w-full" />
      
      <div className="p-4 lg:p-6 flex flex-col items-center text-center gap-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          {player.abbrev}
        </span>
        
        {/* Responsive text size for names */}
        <h3 className={`font-black text-slate-800 uppercase leading-tight ${isGoalie ? 'text-sm lg:text-base' : 'text-[11px] lg:text-sm'}`}>
          {player.name.split(' ').pop()}
        </h3>

        {/* Responsive text size for points */}
        <div className={`font-mono mt-1 ${pointColor} ${isGoalie ? 'text-lg lg:text-xl' : 'text-xs lg:text-base'}`}>
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
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}