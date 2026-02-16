import { useState } from "react";
import api from "../../lib/api";

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newTeam: any) => void;
    userId: number;
}

export default function CreateTeamModal({
    isOpen,
    onClose,
    onCreated,
    userId,
}: CreateTeamModalProps) {
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsCreating(true);
        try {
            const res = await api.post("/fantasy-teams", {
                team_name: name,
                user_id: userId,
            });

            if (res.data.ok) {
                onCreated(res.data.team);
                setName("");
                onClose();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create team");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                        Create New Team
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                            Team Name
                        </label>
                        <input
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter team name"
                            className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-5 py-3 rounded-md bg-white text-slate-700 border border-slate-300 font-semibold uppercase tracking-wide hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="flex-1 px-5 py-3 rounded-md bg-slate-900 text-white font-semibold uppercase tracking-wide hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isCreating ? "Creating..." : "Create Team"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
