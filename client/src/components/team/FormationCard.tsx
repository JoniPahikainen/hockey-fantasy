export default function FormationCard({ player, label, onRemove, isGoalie }: {
  player?: any;
  label: string;
  onRemove: (id: number) => void;
  isGoalie?: boolean;
}) {
  if (!player) {
    return (
      <div className="border-2 border-dashed border-border-default bg-bg-secondary/50 flex flex-col items-center justify-center p-6 min-h-[120px]">
        <span className="text-[10px] font-black text-text-muted-subtle uppercase tracking-widest">{label}</span>
      </div>
    );
  }

  const playerColor = player.color || "#000000ff";
  const pts = Number(player.points) || 0;

  return (
    <div className="bg-bg-primary border border-border-default flex flex-col shadow-sm transition-all hover:border-border-focus group relative">
      <div style={{ backgroundColor: playerColor }} className="h-1.5 w-full" />
      <button
        onClick={() => onRemove(player.id)}
        className="absolute -top-2 -right-2 bg-bg-sidebar text-text-inverse w-6 h-6 text-[10px] flex items-center justify-center hover:bg-accent-danger transition-colors z-30 shadow-md"
      >
        ×
      </button>
      <div className="p-4 flex flex-col items-center text-center gap-1">
        <span style={{ color: playerColor }} className="font-bold text-[9px] uppercase tracking-tighter">
          {player.team}
        </span>
        <h3 className={`font-black text-text-secondary uppercase leading-tight ${isGoalie ? "text-base" : "text-[12px]"}`}>
          {player.name.split(" ").pop()}
        </h3>
        <div className={`font-mono mt-1 text-xs ${pts > 0 ? "text-accent-success font-bold" : pts < 0 ? "text-accent-danger font-bold" : "text-text-muted-subtle"}`}>
          {pts > 0 ? `+${pts.toFixed(1)}` : pts.toFixed(1)}
        </div>
        <div className="mt-2 pt-2 border-t border-border-input w-full">
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-tighter">
            ${(Math.floor(Number(player.salary) / 1000) * 1000).toLocaleString("en-US").replace(/,/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
}