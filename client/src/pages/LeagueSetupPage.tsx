import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";

export default function LeagueSetupPage() {
  const navigate = useNavigate();

  // Use useMemo to prevent re-parsing user every render
  const user = useMemo(() => {
    const str = localStorage.getItem("user");
    return str ? JSON.parse(str) : null;
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New States for Multi-Team Support
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");

  const [joinData, setJoinData] = useState({ leagueId: "", passcode: "" });
  const [createData, setCreateData] = useState({ name: "", passcode: "" });

  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/fantasy-teams/owner/${user.id}`);
        if (res.data.ok && res.data.teams.length > 0) {
          setUserTeams(res.data.teams);
          setSelectedTeamId(res.data.teams[0].team_id || res.data.teams[0].id);
        }
      } catch (err) {
        console.error("Could not fetch user teams", err);
      }
    };
    fetchUserTeams();
  }, [user]);

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return setError("Please select a team first.");

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/leagues", {
        name: createData.name,
        passcode: createData.passcode,
        creator_id: user.id,
      });
      console .log("League creation response:", res);
      if (res.data.ok) {
        console.log("Joining league with ID:", res.data.league.league_id);
        console.log("Using team ID:", selectedTeamId);
        await api.post("/leagues/join", {
          league_id: res.data.league.league_id,
          passcode: createData.passcode,
          team_id: selectedTeamId,
        });
        window.location.href = "/league";
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create league");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId)
      return setError("Select a team to represent in this league.");

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/leagues/join", {
        league_id: Number(joinData.leagueId),
        passcode: joinData.passcode,
        team_id: selectedTeamId,
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
            League Dashboard
          </h1>
          <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">
            Manage Teams & Leagues
          </p>
        </header>

        <main className="max-w-7xl mx-auto space-y-8">
          {/* TEAM SELECTOR SECTION */}
          <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                Select Active Franchise
              </h2>
              <span className="text-[10px] font-bold text-indigo-200 uppercase italic">
                Required
              </span>
            </div>

            <div className="p-6">
              {userTeams.length > 0 ? (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Current Team
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black uppercase focus:border-indigo-600 outline-none cursor-pointer appearance-none"
                  >
                    {userTeams.map((t) => (
                      <option key={t.team_id} value={t.team_id}>
                        {t.team_name} (ID: {t.team_id})
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase italic">
                    This team will be used for the actions below
                  </p>
                </div>
              ) : (
                <div className="py-2 flex flex-col items-start">
                  <p className="text-[10px] font-black uppercase text-rose-600 mb-3">
                    No teams found. You must create a team before joining a
                    league.
                  </p>
                  <button
                    onClick={() => navigate("/teams")}
                    className="bg-slate-900 text-white text-[9px] font-black uppercase px-6 py-2 tracking-widest hover:bg-indigo-600 transition-all"
                  >
                    Create Team
                  </button>
                </div>
              )}
            </div>
          </div>
          {error && (
            <div className="bg-rose-50 border border-rose-200 px-4 py-3">
              <span className="text-[10px] font-black uppercase text-rose-700">
                {error}
              </span>
            </div>
          )}

          {/* JOIN LEAGUE SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                  Join League
                </h2>
              </div>
              <form onSubmit={handleJoinLeague} className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    League ID
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black focus:border-indigo-600 outline-none"
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
                  disabled={loading || !selectedTeamId}
                  className="w-full bg-slate-900 text-white text-[10px] font-black uppercase py-4 tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Enter League"}
                </button>
              </form>
            </div>

            {/* CREATE LEAGUE SECTION */}
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
                    className="w-full border-b-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black focus:border-indigo-600 outline-none"
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
                  disabled={loading || !selectedTeamId}
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
