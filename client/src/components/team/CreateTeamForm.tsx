import { useState } from "react";
import api from "../../lib/api";

export default function CreateTeamForm({ userId, onCreated }: { userId: number, onCreated: () => void }) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    console.log("Creating team...");
    e.preventDefault();
    setIsCreating(true);
    try {
      console.log("Creating team with name:", name, "for user ID:", userId);
      const res = await api.post("/fantasy-teams", { team_name: name, user_id: userId });
      if (res.data.ok) onCreated();
    } catch (err) {
      alert("Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-100">
      <div className="max-w-md w-full bg-white border-2 border-slate-900 p-10 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Create Team</h1>        
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Team Name</label>
            <input 
              required
              className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-4 text-lg font-black outline-none focus:border-indigo-600 transition-colors"
              placeholder="Enter your team name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button 
            disabled={isCreating}
            className="w-full bg-slate-900 text-white font-black uppercase py-5 tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-50 transition-all"
          >
            {isCreating ? "Deploying..." : "Create Team"}
          </button>
        </form>
      </div>
    </div>
  );
}