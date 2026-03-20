interface TeamHeaderProps {
  activeTeamName: string;
  lineupCount: number;
  totalSalary: number;
  isDirty: boolean;
  isSaving: boolean;
  tradingLocked?: boolean;
  onSave: () => void;
}

export default function TeamHeader({
  activeTeamName,
  lineupCount,
  totalSalary,
  isDirty,
  isSaving,
  tradingLocked = false,
  onSave,
}: TeamHeaderProps) {

  return (
    <div className="px-6 pt-8 pb-4 bg-bg-primary z-10 border-b border-border-default">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic text-text-primary leading-none">
          Team Editor
        </h1>

        <button
          onClick={onSave}
          disabled={!isDirty || isSaving || tradingLocked}
          className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${
              !isDirty || tradingLocked
                ? "bg-bg-tertiary text-text-muted-subtle cursor-not-allowed"
                : isDirty
                ? "bg-bg-sidebar text-text-inverse hover:bg-bg-sidebar-hover"
                : "bg-bg-tertiary text-text-muted-subtle cursor-not-allowed"
            }
            ${isSaving ? "opacity-50" : ""}
          `}
        >
          {isSaving
            ? "Syncing..."
            : tradingLocked
              ? "Trading Locked"
              : isDirty
                ? "Save Changes"
                : "Lineup Locked"}
        </button>
      </div>

      <div className="flex items-center justify-end gap-10">
        <div className="flex flex-col text-right">
          <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">
            Active Team
          </span>
          <span className="font-black text-sm text-text-primary uppercase">
            {activeTeamName}
          </span>
        </div>

        <div className="w-px h-8 bg-bg-tertiary"></div>

        <div className="flex flex-col text-right">
          <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">
            Salary Used
          </span>
          <span className="font-mono font-black text-lg text-text-primary">
            ${Number(totalSalary || 0).toLocaleString()}
          </span>
        </div>

        <div className="w-px h-8 bg-bg-tertiary"></div>

        <div className="flex flex-col text-right">
          <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">
            Team Slots
          </span>
          <span className="font-mono font-black text-lg text-text-primary">
            {lineupCount} <span className="text-text-muted-subtle">/ 6</span>
          </span>
        </div>
      </div>
    </div>
  );
}
