interface TeamHeaderProps {
  userTeams: any[];
  selectedTeamId: number | null;
  setSelectedTeamId: (id: number) => void;
  lineupCount: number;
  totalSalary: number;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function TeamHeader({
  userTeams, selectedTeamId, setSelectedTeamId, lineupCount, totalSalary, isDirty, isSaving, onSave
}: TeamHeaderProps) {
  return (
    <div className="px-6 pt-8 pb-0 bg-white z-10">
      <header className="flex flex-col lg:flex-row lg:justify-between mb-2 gap-4 items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
            Team Editor
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Team</span>
            <select 
              value={selectedTeamId || ""} 
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              className="bg-transparent text-slate-900 text-sm font-black uppercase outline-none cursor-pointer"
            >
              {userTeams.map(t => (
                <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salary Used</span>
            <span className="font-mono font-black text-lg text-slate-900">
              ${Number(totalSalary || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Team Slots</span>
            <span className="font-mono font-black text-lg text-slate-900">
              {lineupCount} <span className="text-slate-300">/ 6</span>
            </span>
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${isDirty 
              ? "bg-slate-900 text-white hover:bg-slate-800" 
              : "bg-slate-100 text-slate-300 cursor-not-allowed"}
            ${isSaving ? "opacity-50" : ""}
          `}
        >
          {isSaving ? "Syncing..." : isDirty ? "Save Changes" : "Lineup Locked"}
        </button>
      </div>
    </div>
  );
}