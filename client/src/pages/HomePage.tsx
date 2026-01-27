import { useEffect, useState } from "react";
import Sidebar from "../components/common/Sidebar";
{/* import Calender from "../components/home/Calender"; */}
import RosterList from "../components/home/RosterList";
import UpcomingMatches from "../components/home/UpcomingMatches";
import MiniStandings from "../components/home/MiniStandings";
import BestPerformers from "../components/home/BestPerformers";
import api from "../lib/api";

export default function HomePage() {
  const [userName, setUserName] = useState("Team Manager");
  const [userRoster, setUserRoster] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [optimalLineup, setOptimalLineup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);
    setUserName(user.username || "Team Manager");
    const userId = user.id;

    const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [matchRes, dashRes, optimalRes] = await Promise.all([
        api.get(`/matches/${todayStr}`),
        api.get(`/fantasy-teams/user-dashboard/${userId}`),
        api.get(`/fantasy-teams/optimal-lineups`)
        
      ]);

      if (matchRes.data.ok) {
        setMatches(matchRes.data.matches);
      }

      if (dashRes.data.ok && dashRes.data.team) {
        setUserRoster(dashRes.data.team.players);
      }

      if (optimalRes.data.ok) {
        setOptimalLineup(optimalRes.data.best || []);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

    fetchDashboardData();
  }, [todayStr]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />

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
            <BestPerformers team={optimalLineup} />
            {/* <Calender data={GM_PLANNER_DATA} today={todayNum} /> */}
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
            <MiniStandings />
            <RosterList team={userRoster} />
          </div>
        </div>
      </div>
    </div>
  );
}
