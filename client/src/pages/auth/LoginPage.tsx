import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/user/login", { email, password });
      
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        const darkMode = Boolean(res.data.user?.dark_mode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
        if (darkMode) {
          document.documentElement.dataset.theme = "dark";
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
        
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Authentication failed. Check your identity or access key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
      <div className="max-w-[400px] w-full">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-text-primary">
            FANTASY <span className="text-text-muted-subtle">LEAGUE</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mt-2">
            Competitive Hockey Management
          </p>
        </div>
        
        <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
          
          {/* HEADER SECTION */}
          <div className="px-8 py-6 bg-bg-sidebar flex justify-between items-center">
            <h2 className="text-xs font-black text-text-inverse uppercase tracking-[0.2em]">
              Manager <span className="text-text-muted-subtle">Access</span>
            </h2>
            <div className="text-right">
              <span className="text-[10px] font-black text-text-muted uppercase block leading-none mb-1">
                Security
              </span>
              <span className="text-sm font-mono font-black text-text-inverse leading-none uppercase">
                {isLoading ? "Wait..." : "Auth_v2"}
              </span>
            </div>
          </div>

          {/* FORM SECTION */}
          <div className="p-8 bg-bg-primary">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              
              {/* ERROR DISPLAY */}
              {error && (
                <div className="bg-bg-danger-muted border border-border-danger-muted px-4 py-3 text-[10px] font-black text-accent-danger uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Identity (Email)
                </label>
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  className="bg-bg-secondary text-text-primary border border-border-default p-3 text-[12px] font-bold outline-none focus:border-border-focus transition-all disabled:opacity-50"
                  placeholder="name@league.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Password
                </label>
                <input
                  type="password"
                  required
                  disabled={isLoading}
                  className="bg-bg-secondary text-text-primary border border-border-default p-3 text-[12px] font-bold outline-none focus:border-border-focus transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`mt-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm
                  ${isLoading 
                    ? "bg-bg-disabled text-text-inverse cursor-not-allowed" 
                    : "bg-bg-sidebar text-text-inverse hover:bg-bg-sidebar-hover"
                  }`}
              >
                {isLoading ? "Authenticating..." : "Enter Dashboard"}
              </button>
            </form>
          </div>

          {/* FOOTER */}
          <div className="bg-bg-secondary px-8 py-4 border-t border-border-default flex justify-between items-center">
            <span className="text-[10px] font-black text-text-muted-subtle uppercase tracking-widest">
              No Account?
            </span>
            <Link 
              to="/register" 
              className="text-[10px] font-black text-text-primary uppercase underline underline-offset-4 hover:text-text-secondary"
            >
              Register Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}