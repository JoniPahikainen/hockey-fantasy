import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";
import CreateTeamForm from "../components/team/CreateTeamForm";
import TeamEditor from "../components/team/TeamEditor"; // Your existing code

export default function DailyTeamPage() {
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    const str = localStorage.getItem("user");
    return str ? JSON.parse(str) : null;
  }, []);

  const fetchTeams = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/fantasy-teams/owner/${user.id}`);
      if (res.data.ok) setUserTeams(res.data.teams);
    } catch (err) {
      console.error("Error fetching teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, [user]);

  if (loading) return <div className="ml-16 p-8">Loading Console...</div>;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-16 overflow-hidden">
        {userTeams.length > 0 ? (
          <TeamEditor 
            initialTeams={userTeams} 
            userId={user.id} 
          />
        ) : (
          <CreateTeamForm onCreated={fetchTeams} userId={user.id} />
        )}
      </div>
    </div>
  );
}