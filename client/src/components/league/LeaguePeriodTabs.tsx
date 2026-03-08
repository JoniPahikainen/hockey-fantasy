import { LEAGUE_PERIODS } from "../../data/mockData";

interface Props {
  activePeriod: number;
  currentPeriod: number | null;
  onSelectPeriod: (periodId: number) => void;
}

export default function LeaguePeriodTabs({
  activePeriod,
  currentPeriod,
  onSelectPeriod,
}: Props) {
  return (
    <div className="flex gap-1 border-b border-border-default pb-4 overflow-x-auto">
      {LEAGUE_PERIODS.map((p) => {
        const isActive = activePeriod === p.id;
        const isLocked =
          currentPeriod !== null && p.id !== 6 && p.id > currentPeriod;
        return (
          <button
            key={p.id}
            disabled={isLocked}
            onClick={() => onSelectPeriod(p.id)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors
              ${isActive ? "bg-bg-sidebar text-text-inverse" : "text-text-muted-subtle hover:text-text-primary"}
              ${isLocked ? "opacity-20 cursor-not-allowed" : ""}
            `}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
