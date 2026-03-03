import { useState, useEffect } from "react";
import Sidebar from "../components/common/Sidebar";
import api from "../lib/api";

type UserInfo = {
  id: number;
  username: string;
  email: string;
  role?: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.dataset.theme = "dark";
    } else {
      setTheme("light");
      document.documentElement.removeAttribute("data-theme");
    }

    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const parsed = JSON.parse(userStr);
      const u = {
        id: parsed.id ?? parsed.user_id,
        username: parsed.username ?? "",
        email: parsed.email ?? "",
        role: parsed.role,
      };
      setUser(u);
      setUsernameDraft(u.username);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.dataset.theme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const syncUserToStorage = (updated: Partial<UserInfo>) => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const parsed = JSON.parse(userStr);
      const next = { ...parsed, ...updated };
      localStorage.setItem("user", JSON.stringify(next));
      setUser((prev) => (prev ? { ...prev, ...updated } : null));
    } catch {
      // ignore
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameDraft.trim();
    if (!trimmed || trimmed === user?.username) return;
    setUsernameError(null);
    setUsernameSaving(true);
    try {
      const res = await api.patch("/user/profile", { username: trimmed });
      if (res.data.ok && res.data.user) {
        syncUserToStorage({ username: res.data.user.username });
      } else {
        setUsernameError(res.data?.error || "Failed to update username");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setUsernameError(err.response?.data?.error || "Failed to update username");
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      setPasswordError("Current password is required");
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError("New password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordSaving(true);
    try {
      const res = await api.patch("/user/password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      if (res.data.ok) {
        setPasswordSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res.data?.error || "Failed to update password");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setPasswordError(err.response?.data?.error || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen bg-bg-secondary text-text-primary">
      <Sidebar />

      <div className="flex-1 overflow-auto px-6 py-8 ml-16">
        <header className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Settings
          </h1>
          <p className="text-text-muted font-medium tracking-tight mt-1">
            Account & preferences
          </p>
        </header>

        <div className="max-w-xl space-y-8">
          {/* Appearance */}
          <section className="bg-bg-primary border border-border-default rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Appearance
              </h2>
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Theme</p>
                <p className="text-xs text-text-muted">
                  Switch between light and dark mode.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-border-input bg-bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    theme === "light"
                      ? "bg-bg-primary text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    theme === "dark"
                      ? "bg-bg-primary text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="bg-bg-primary border border-border-default rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Account
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {user ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Username
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={usernameDraft}
                        onChange={(e) => setUsernameDraft(e.target.value)}
                        className="flex-1 border border-border-input px-3 py-2 text-text-primary rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none"
                        placeholder="Username"
                      />
                      <button
                        type="button"
                        onClick={handleSaveUsername}
                        disabled={usernameSaving || usernameDraft.trim() === user.username}
                        className="px-4 py-2 text-sm font-semibold uppercase tracking-wider bg-bg-sidebar text-text-inverse rounded-lg hover:bg-bg-sidebar-hover disabled:opacity-50 transition"
                      >
                        {usernameSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                    {usernameError && (
                      <p className="text-accent-danger text-sm mt-1">{usernameError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                      Email
                    </label>
                    <p className="text-text-primary font-medium">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                        Role
                      </label>
                      <p className="text-text-primary font-medium capitalize">
                        {user.role}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-text-muted text-sm">No account info available.</p>
              )}
            </div>
          </section>

          {/* Change password */}
          <section className="bg-bg-primary border border-border-default rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Change password
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full border border-border-input px-3 py-2 text-text-primary rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-border-input px-3 py-2 text-text-primary rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-border-input px-3 py-2 text-text-primary rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              {passwordError && (
                <p className="text-accent-danger text-sm">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-accent-success text-sm">Password updated.</p>
              )}
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wider bg-bg-sidebar text-text-inverse rounded-lg hover:bg-bg-sidebar-hover disabled:opacity-50 transition"
              >
                {passwordSaving ? "Saving…" : "Update password"}
              </button>
            </div>
          </section>

          {/* Session */}
          <section className="bg-bg-primary border border-border-default rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-bg-secondary">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                Session
              </h2>
            </div>
            <div className="p-6">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wider text-accent-danger border border-border-danger-muted rounded-lg hover:bg-bg-danger-muted transition"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
