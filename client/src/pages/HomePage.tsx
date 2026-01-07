import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Calender from "../components/Calender";
import RosterList from "../components/RosterList";
import UpcomingMatches from "../components/UpcomingMatches";
import {
  GM_PLANNER_DATA,
  TEAM_DATA,
  PERIOD_DATA,
} from "../data/mockData";
import MiniStandings from "../components/MiniStandings";
import BestPerformers from "../components/BestPerformers";
import api from "../lib/api";

export default function HomePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Team Manager");
  const todayNum = new Date().getDate();

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDailyMatches = async (dateStr: string) => {
    try {
        setLoading(true);
        const response = await api.get(`/matches/${dateStr}`);

      if (response.data.ok) {
            setMatches(response.data.matches);
        }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.username || user.email || "Team Manager");
      } catch (e) {}
    }

    const today = new Date().toISOString().split("T")[0];
    fetchDailyMatches(today);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar onLogout={() => navigate("/login")} />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        {/* HEADER SECTION */}
        <header className="flex flex-col lg:flex-row lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              Welcome, {userName}!
            </h1>
            <p className="text-slate-500 font-medium tracking-tight">
              GM DASHBOARD // SEASON STATS
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              placeholder="Search"
              className="border border-slate-300 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none"
            />
            <div className="w-10 h-10 bg-slate-900 shadow-lg" />
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-9 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <BestPerformers team={TEAM_DATA} />
            <Calender data={GM_PLANNER_DATA} today={todayNum} />
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {loading ? (
              <div className="p-4 bg-white border border-slate-900 italic">
                Loading tonight's action...
              </div>
            ) : (
              <UpcomingMatches match_data={matches} />
            )}
            <MiniStandings team_data={PERIOD_DATA[3]} />
            <RosterList team={TEAM_DATA} />
          </div>
        </div>
      </div>
    </div>
  );
}
