import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Calender from "../components/Calender";
import RosterList from "../components/RosterList";
import UpcomingMatches from "../components/UpcomingMatches";
import { GM_PLANNER_DATA, TEAM_DATA, MATCH_DATA, allTeams } from "../data/mockData";
import MiniStandings from "../components/MiniStandings"

export default function HomePage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Team Manager");
  const todayNum = new Date().getDate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      setUserName(user.username || user.email || "Team Manager");
    } catch (e) {}
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar onLogout={() => navigate("/login")} />

      <div className="flex-1 overflow-auto px-6 py-8">
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
            <Calender data={GM_PLANNER_DATA} today={todayNum} />
            <RosterList team={TEAM_DATA} />
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 flex flex-col gap-6"> 
            <UpcomingMatches match_data={MATCH_DATA} />
            <MiniStandings team_data={allTeams} />
          </div>
        </div>
      </div>
    </div>
  );
}
