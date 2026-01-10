export default function FormationCard({ player, label, onRemove, isGoalie }: {
  player?: any;
  label: string;
  onRemove: (id: number) => void;
  isGoalie?: boolean;
}) {
  if (!player) {
    return (
      <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-6 min-h-[120px]">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
      </div>
    );
  }

  const playerColor = player.color || "#000000ff";
  const pts = Number(player.points) || 0;

  return (
    <div className="bg-white border border-slate-200 flex flex-col shadow-sm transition-all hover:border-slate-400 group relative">
      <div style={{ backgroundColor: playerColor }} className="h-1.5 w-full" />
      <button
        onClick={() => onRemove(player.id)}
        className="absolute -top-2 -right-2 bg-black text-white w-6 h-6 text-[10px] flex items-center justify-center hover:bg-rose-600 transition-colors z-30 shadow-md"
      >
        ×
      </button>
      <div className="p-4 flex flex-col items-center text-center gap-1">
        <span style={{ color: playerColor }} className="font-bold text-[9px] uppercase tracking-tighter">
          {player.team}
        </span>
        <h3 className={`font-black text-slate-800 uppercase leading-tight ${isGoalie ? "text-base" : "text-[12px]"}`}>
          {player.name.split(" ").pop()}
        </h3>
        <div className={`font-mono mt-1 text-xs ${pts > 0 ? "text-emerald-600 font-bold" : pts < 0 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
          {pts > 0 ? `+${pts.toFixed(1)}` : pts.toFixed(1)}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-300 w-full">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
            ${Number(player.salary).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}