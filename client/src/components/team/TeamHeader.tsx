interface TeamHeaderProps {
  activeTeamName: string;
  lineupCount: number;
  totalSalary: number;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function TeamHeader({
  activeTeamName,
  lineupCount,
  totalSalary,
  isDirty,
  isSaving,
  onSave,
}: TeamHeaderProps) {

  return (
    <div className="px-6 pt-8 pb-4 bg-white z-10 border-b border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
          Team Editor
        </h1>

        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${
              isDirty
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }
            ${isSaving ? "opacity-50" : ""}
          `}
        >
          {isSaving ? "Syncing..." : isDirty ? "Save Changes" : "Lineup Locked"}
        </button>
      </div>

      <div className="flex items-center justify-end gap-10">
        <div className="flex flex-col text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Active Team
          </span>
          <span className="font-black text-sm text-slate-900 uppercase">
            {activeTeamName}
          </span>
        </div>

        <div className="w-px h-8 bg-slate-100"></div>

        <div className="flex flex-col text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Salary Used
          </span>
          <span className="font-mono font-black text-lg text-slate-900">
            ${Number(totalSalary || 0).toLocaleString()}
          </span>
        </div>

        <div className="w-px h-8 bg-slate-100"></div>

        <div className="flex flex-col text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Team Slots
          </span>
          <span className="font-mono font-black text-lg text-slate-900">
            {lineupCount} <span className="text-slate-300">/ 6</span>
          </span>
        </div>
      </div>
    </div>
  );
}
