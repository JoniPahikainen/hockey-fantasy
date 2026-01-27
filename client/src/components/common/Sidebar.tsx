import { useNavigate, useLocation } from "react-router-dom";

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const iconBtn =
  "relative flex items-center justify-center w-10 h-10 text-slate-500 hover:text-white hover:bg-white/10 transition-colors duration-75 group mb-4";

const activeBtn =
  "relative flex items-center justify-center w-10 h-10 bg-white text-black group mb-4";

const tooltip =
  "absolute left-full ml-4 px-2 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 w-16 h-screen bg-slate-900 border-r border-white/10 flex flex-col items-center z-40">
      <div className="flex-[0.4]" />
      <nav className="flex flex-col items-center">
        <button
          onClick={() => navigate("/")}
          className={isActive("/") ? activeBtn : iconBtn}
        >
          {isActive("/") && (
            <div className="absolute -left-3 w-1 h-6 bg-white" />
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

        <button onClick={() => navigate("/roster")} className={iconBtn}>
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
          <span className={tooltip}>Roster</span>
        </button>

        <button className={iconBtn}>
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
              d="M12 7a4 4 0 100 8 4 4 0 000-8zM4 21a8 8 0 0116 0"
            />
          </svg>
          <span className={tooltip}>Market</span>
        </button>

        <button onClick={() => navigate("/league")} className={iconBtn}>
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
      </nav>

      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2 pb-8">
        <button onClick={() => navigate("/settings")} className={iconBtn}>
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
