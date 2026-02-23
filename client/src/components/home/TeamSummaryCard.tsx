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
    <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
        <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
          Team Summary
        </h2>
        <span className="text-[10px] font-black text-slate-400 uppercase">
          {rosterSize} players
        </span>
      </div>
      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total points</span>
          <span
            className={`font-mono font-black text-lg ${
              teamPoints > 0 ? "text-emerald-600" : teamPoints < 0 ? "text-red-600" : "text-slate-500"
            }`}
          >
            {teamPoints > 0 ? "+" : ""}{teamPoints.toFixed(1)}
          </span>
        </div>
        <div className="flex gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600">{positiveCount} positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-slate-600">{negativeCount} negative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold text-slate-600">{zeroCount} zero</span>
          </div>
        </div>
      </div>
    </div>
  );
}
