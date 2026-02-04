import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import api from "../../lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/user/register", formData);

      console.log("Registration response:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        console.log("Registration successful");
      }
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-[400px] w-full">
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-slate-900">
            FANTASY <span className="text-slate-400">LEAGUE</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">
            Competitive Hockey Management
          </p>
        </div>

        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          
          {/* HEADER SECTION */}
          <div className="px-8 py-6 bg-slate-900 flex justify-between items-center">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">
              New <span className="text-slate-400">Manager</span>
            </h2>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase block leading-none mb-1">
                System
              </span>
              <span className="text-sm font-mono font-black text-white leading-none">
                REG_v1
              </span>
            </div>
          </div>

          {/* FORM SECTION */}
          <div className="p-8 bg-white">
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              
              {/* ERROR DISPLAY */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 px-4 py-3 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Username
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  className="bg-slate-50 border border-slate-200 p-3 text-[12px] font-bold outline-none focus:border-slate-400 transition-all disabled:opacity-50"
                  placeholder="Manager_Name"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  className="bg-slate-50 border border-slate-200 p-3 text-[12px] font-bold outline-none focus:border-slate-400 transition-all disabled:opacity-50"
                  placeholder="name@league.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                <input
                  type="password"
                  required
                  disabled={isLoading}
                  className="bg-slate-50 border border-slate-200 p-3 text-[12px] font-bold outline-none focus:border-slate-400 transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`mt-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm
                  ${isLoading 
                    ? "bg-slate-400 text-white cursor-not-allowed" 
                    : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
              >
                {isLoading ? "Creating Account..." : "Initialize Profile"}
              </button>
            </form>
          </div>

          {/* FOOTER */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Member?
            </span>
            <Link 
              to="/login" 
              className="text-[10px] font-black text-slate-900 uppercase underline underline-offset-4 hover:text-slate-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}