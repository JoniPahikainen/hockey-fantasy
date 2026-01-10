interface RosterHeaderProps {
  userTeams: any[];
  selectedTeamId: number | null;
  setSelectedTeamId: (id: number) => void;
  lineupCount: number;
  totalSalary: number;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export default function RosterHeader({
  userTeams, selectedTeamId, setSelectedTeamId, lineupCount, totalSalary, isDirty, isSaving, onSave
}: RosterHeaderProps) {
  return (
    <div className="px-8 py-6 bg-slate-900 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
            Roster <span className="text-slate-500">Editor</span>
          </h1>
          <div className="mt-4">
            <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Active Fantasy Team</p>
            <select 
              value={selectedTeamId || ""} 
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              className="bg-slate-800 text-white text-[10px] font-bold uppercase py-1 px-2 border border-slate-700 outline-none focus:border-emerald-500"
            >
              {userTeams.map(t => (
                <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 border-l border-slate-800 pl-8">
          <div>
            <p className="text-[8px] font-black uppercase text-slate-500">Total Salary</p>
            <p className="text-sm font-mono font-bold text-emerald-400">${totalSalary.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase text-slate-500">Remaining Slots</p>
            <p className="text-sm font-mono font-bold text-white">{6 - lineupCount} / 6</p>
          </div>
        </div>
      </div>
      
      <button
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300
          ${!isDirty ? "bg-slate-800 text-slate-500 cursor-default opacity-50" 
            : "bg-amber-400 text-black hover:bg-amber-300 shadow-[4px_4px_0px_0px_rgba(251,191,36,0.3)] animate-pulse"}
          ${isSaving ? "bg-emerald-500 text-white animate-none opacity-100" : ""}
        `}
      >
        {isSaving ? "Saving..." : isDirty ? "Save Changes" : "Lineup Saved"}
      </button>
    </div>
  );
}