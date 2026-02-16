import { useState } from "react";
import api from "../../lib/api";

export default function CreateTeamForm({
  userId,
  onCreated,
}: {
  userId: number;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const res = await api.post("/fantasy-teams", {
        team_name: name,
        user_id: userId,
      });
      if (res.data.ok) onCreated();
    } catch {
      alert("Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-10 bg-slate-100">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-10 shadow-xl">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 mb-8">
          Create Team
        </h1>

        <form onSubmit={handleCreate} className="space-y-8">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Team Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
            />
          </div>

          <button
            disabled={isCreating || !name.trim()}
            className="w-full px-5 py-3 rounded-md bg-slate-900 text-white font-semibold uppercase tracking-wide hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isCreating ? "Creating..." : "Create Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
