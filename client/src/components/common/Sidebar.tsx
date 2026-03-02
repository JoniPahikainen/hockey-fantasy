import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../lib/api";
import { useActiveTeam } from "../../context/ActiveTeamContext";
import CreateTeamModal from "../team/CreateTeamModal";

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const iconBtn =
  "relative flex items-center justify-center w-10 h-10 text-text-muted hover:text-text-inverse hover:bg-bg-primary/10 transition-colors duration-75 group mb-4";

const activeBtn =
  "relative flex items-center justify-center w-10 h-10 bg-bg-primary text-text-primary group mb-4";

const tooltip =
  "absolute left-full ml-4 px-2 py-1 bg-bg-primary text-text-primary text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTeamId, activeTeamName, setActiveTeam } = useActiveTeam();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setLoadingTeams(false);
      return;
    }

    const user = JSON.parse(userStr);

    const fetchTeams = async () => {
      try {
        const res = await api.get(`/fantasy-teams/owner/${user.id}`);
        if (res.data.ok) {
          setMyTeams(res.data.teams || []);
        }
      } catch (err) {
        console.error("Failed to load teams for sidebar", err);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (!myTeams.length) return;
    if (activeTeamId && myTeams.some((t) => t.team_id === activeTeamId)) {
      return;
    }

    const initialTeam = myTeams[0];

    setActiveTeam({
      id: initialTeam.team_id,
      name: initialTeam.team_name,
    });
  }, [myTeams, activeTeamId, setActiveTeam]);

  const isActive = (path: string) => location.pathname === path;

  const userStr = localStorage.getItem("user");
  let isAdmin = false;
  try {
    if (userStr) {
      const user = JSON.parse(userStr);
      isAdmin = user?.role === "admin";
    }
  } catch {
    // ignore
  }

  return (
    <aside className="fixed left-0 top-0 w-16 h-screen bg-bg-sidebar border-r border-text-inverse/10 flex flex-col items-center z-40">
      <div className="relative flex flex-col items-center py-6 border-b border-border-sidebar mb-4 w-full">
        {/* Active Team Button */}
        <button
          onClick={() => {
            if (!loadingTeams && myTeams.length > 0) {
              setIsSwitcherOpen((prev) => !prev);
            }
          }}
          className="w-11 h-11 rounded-full bg-bg-sidebar-active text-text-inverse flex items-center justify-center text-sm font-bold 
               hover:bg-bg-sidebar-hover transition-colors duration-150 
               ring-1 ring-border-strong hover:ring-border-focus disabled:opacity-50"
          disabled={loadingTeams || myTeams.length === 0}
        >
          {activeTeamName
            ? activeTeamName.charAt(0)
            : loadingTeams
              ? "..."
              : "?"}
        </button>

        {/* Dropdown */}
        {isSwitcherOpen && (
          <div
            className="absolute left-16 top-6 w-56 bg-bg-sidebar border border-border-sidebar 
                    rounded-xl shadow-2xl z-[60] py-2 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-text-muted">
              My Teams
            </div>

            {/* Teams */}
            <div className="flex flex-col max-h-80 overflow-y-auto">
              {myTeams.map((team) => {
                const isCurrent = activeTeamId === team.team_id;

                return (
                  <button
                    key={team.team_id}
                    onClick={() => {
                      setActiveTeam({
                        id: team.team_id,
                        name: team.team_name,
                      });
                      setIsSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${
                  isCurrent
                    ? "bg-bg-sidebar-hover text-text-inverse"
                    : "text-text-muted-subtle hover:bg-bg-sidebar-hover hover:text-text-inverse"
                }
              `}
                  >
                    <span
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold
                  ${
                    isCurrent
                      ? "bg-bg-primary text-text-primary"
                      : "bg-bg-sidebar-active text-text-muted-subtle"
                  }
                `}
                    >
                      {team.team_name.charAt(0)}
                    </span>
                    <span className="truncate">{team.team_name}</span>
                  </button>
                );
              })}

              {myTeams.length === 0 && !loadingTeams && (
                <div className="px-4 py-3 text-[11px] text-text-muted-subtle">
                  No teams yet. Create one to get started.
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-border-sidebar" />

            {/* Create Team */}
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                setIsSwitcherOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm font-semibold 
                   text-accent-primary hover:bg-accent-primary/10 transition-colors"
            >
              + Create New Team
            </button>
          </div>
        )}
      </div>

      {/* Create Team Modal for Active Team Selector */}
      {isCreateModalOpen && (
        <CreateTeamModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          userId={(() => {
            const userStr = localStorage.getItem("user");
            if (!userStr) return 0;
            try {
              const user = JSON.parse(userStr);
              return user.id ?? 0;
            } catch {
              return 0;
            }
          })()}
          onCreated={(newTeam: any) => {
            setMyTeams((prev) => [...prev, newTeam]);
            if (newTeam && newTeam.team_id && newTeam.team_name) {
              setActiveTeam({
                id: newTeam.team_id,
                name: newTeam.team_name,
              });
            }
          }}
        />
      )}

      <div className="flex-[0.4]" />
      <nav className="flex flex-col items-center">
        <button
          onClick={() => navigate("/")}
          className={isActive("/") ? activeBtn : iconBtn}
        >
          {isActive("/") && (
            <div className="absolute -left-3 w-1 h-6 bg-bg-primary" />
          )}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l9-9 9 9M5 10v10h14V10"
            />
          </svg>
          <span className={tooltip}>Dashboard</span>
        </button>

        <button
          onClick={() => navigate("/team")}
          className={isActive("/team") ? activeBtn : iconBtn}
        >
          {isActive("/team") && (
            <div className="absolute -left-3 w-1 h-6 bg-bg-primary" />
          )}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20H7m10 0v-2a3 3 0 00-6 0v2"
            />
          </svg>
          <span className={tooltip}>Team</span>
        </button>

        <button
          onClick={() => navigate("/league")}
          className={isActive("/league") ? activeBtn : iconBtn}
        >
          {isActive("/league") && (
            <div className="absolute -left-3 w-1 h-6 bg-bg-primary" />
          )}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m-3-7l7 4v6l-7 4-7-4V7l7-4z"
            />
          </svg>
          <span className={tooltip}>Leagues</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className={isActive("/admin") ? activeBtn : iconBtn}
          >
            {isActive("/admin") && (
              <div className="absolute -left-3 w-1 h-6 bg-bg-primary" />
            )}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className={tooltip}>Admin</span>
          </button>
        )}
      </nav>

      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2 pb-8">
        <button
          onClick={() => navigate("/settings")}
          className={isActive("/settings") ? activeBtn : iconBtn}
        >
          {isActive("/settings") && (
            <div className="absolute -left-3 w-1 h-6 bg-bg-primary" />
          )}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15a3 3 0 100-6 3 3 0 000 6z"
            />
          </svg>
          <span className={tooltip}>Settings</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              handleLogout();
            }
          }}
          className={iconBtn}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4-4-4M21 12H7m6 9a3 3 0 01-3-3V6a3 3 0 013-3"
            />
          </svg>
          <span className={tooltip}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
