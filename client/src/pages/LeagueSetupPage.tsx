import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";

export default function LeagueSetupPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);

  const [joinData, setJoinData] = useState({ leagueId: "", passcode: "" });
  const [createData, setCreateData] = useState({ name: "", passcode: "" });

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/fantasy-teams/user-dashboard/${user.id}`);
        if (res.data.ok) {
          setTeamId(res.data.team.id);
        }
      } catch {
        console.error("Could not find team ID");
      }
    };
    fetchUserTeam();
  }, [user]);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/leagues", {
        name: createData.name,
        passcode: createData.passcode,
        creator_id: user.id
      });
      if (res.data.ok) navigate("/league");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create league");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      setError("You need a team to join a league.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/leagues/join", {
        league_id: Number(joinData.leagueId),
        passcode: joinData.passcode,
        team_id: teamId
      });
      if (res.data.ok) navigate("/league");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid League ID or Passcode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="flex flex-col mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Commissioner Console
          </h1>
          <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">
            League Administration
          </p>
        </header>

        <main className="max-w-7xl mx-auto space-y-8">
          {error && (
            <div className="bg-rose-50 border border-rose-200 px-4 py-3">
              <span className="text-[10px] font-black uppercase text-rose-700">
                {error}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* JOIN LEAGUE */}
            <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                  Join League
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                  Existing League
                </span>
              </div>

              <form onSubmit={handleJoinLeague} className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    League ID
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:border-indigo-600 outline-none"
                    value={joinData.leagueId}
                    onChange={(e) =>
                      setJoinData({ ...joinData, leagueId: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Passcode
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:border-indigo-600 outline-none"
                    value={joinData.passcode}
                    onChange={(e) =>
                      setJoinData({ ...joinData, passcode: e.target.value })
                    }
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-slate-900 text-white text-[10px] font-black uppercase py-4 tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Enter League"}
                </button>
              </form>
            </div>

            {/* CREATE LEAGUE */}
            <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                  Create League
                </h2>

              </div>

              <form onSubmit={handleCreateLeague} className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    League Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black uppercase focus:border-indigo-600 outline-none"
                    value={createData.name}
                    onChange={(e) =>
                      setCreateData({ ...createData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Passcode
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:border-indigo-600 outline-none"
                    value={createData.passcode}
                    onChange={(e) =>
                      setCreateData({ ...createData, passcode: e.target.value })
                    }
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-slate-900 text-white text-[10px] font-black uppercase py-4 tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Establish League"}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
