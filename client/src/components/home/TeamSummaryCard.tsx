interface TeamSummaryCardProps {
  teamPoints: number;
  positiveCount: number;
  negativeCount: number;
  zeroCount: number;
  rosterSize: number;
}

export default function TeamSummaryCard({
  teamPoints,
  positiveCount,
  negativeCount,
  zeroCount,
  rosterSize,
}: TeamSummaryCardProps) {
  return (
    <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-bg-sidebar flex justify-between items-center">
        <h2 className="text-xs font-black text-text-inverse uppercase tracking-[0.2em]">
          Team Summary
        </h2>
        <span className="text-[10px] font-black text-text-muted-subtle uppercase">
          {rosterSize} players
        </span>
      </div>
      <div className="p-4 border-t border-border-default space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-black text-text-muted-subtle uppercase">Total points</span>
          <span
            className={`font-mono font-black text-lg ${
              teamPoints > 0 ? "text-accent-success" : teamPoints < 0 ? "text-accent-danger" : "text-text-muted"
            }`}
          >
            {teamPoints > 0 ? "+" : ""}{teamPoints}
          </span>
        </div>
        <div className="flex gap-4 pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-success" />
            <span className="text-[10px] font-bold text-text-secondary">{positiveCount} positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-danger" />
            <span className="text-[10px] font-bold text-text-secondary">{negativeCount} negative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-bg-disabled" />
            <span className="text-[10px] font-bold text-text-secondary">{zeroCount} zero</span>
          </div>
        </div>
      </div>
    </div>
  );
}
