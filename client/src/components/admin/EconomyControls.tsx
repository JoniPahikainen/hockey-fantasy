import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function EconomyControls() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tradeLocked, setTradeLocked] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const loadTradeLockStatus = async () => {
    try {
      const res = await api.get("/admin/trade-lock/status");
      setTradeLocked(Boolean(res.data?.status?.locked));
    } catch {
      setTradeLocked(null);
    }
  };

  useEffect(() => {
    loadTradeLockStatus();
  }, []);

  const runAction = async (endpoint: string, actionName: string) => {
    setActionLoading(actionName);
    setMessage(null);
    try {
      const res = await api.post(endpoint);
      if (res.data.ok) {
        setMessage({
          type: "ok",
          text: res.data.message || `${actionName} completed.`,
        });
      } else {
        setMessage({ type: "err", text: res.data.error || "Action failed" });
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMessage({
        type: "err",
        text: err.response?.data?.error || "Request failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const runTradeLockAction = async (endpoint: string, actionName: string) => {
    setActionLoading(actionName);
    setMessage(null);
    try {
      const res = await api.post(endpoint);
      if (res.data.ok) {
        setMessage({
          type: "ok",
          text: res.data.message || `${actionName} completed.`,
        });
        await loadTradeLockStatus();
      } else {
        setMessage({ type: "err", text: res.data.error || "Action failed" });
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMessage({
        type: "err",
        text: err.response?.data?.error || "Request failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Actions */}
      <section className="rounded-xl border border-border-default bg-bg-primary p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Actions
        </h2>
        <p className="mb-5 text-sm text-text-secondary">
          Recalculate base ratings, regenerate start prices, reset prices to
          start, or process period price update.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              runAction(
                "/admin/economy/recalculate-base-ratings",
                "Recalculate base ratings",
              )
            }
            disabled={!!actionLoading}
            className="rounded-lg bg-bg-sidebar-active px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-inverse shadow-sm transition hover:bg-accent-primary-hover disabled:opacity-50"
          >
            {actionLoading === "Recalculate base ratings"
              ? "Running…"
              : "Recalculate base ratings"}
          </button>
          <button
            onClick={() =>
              runAction(
                "/admin/economy/regenerate-start-prices",
                "Regenerate start prices",
              )
            }
            disabled={!!actionLoading}
            className="rounded-lg bg-bg-sidebar-active px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-inverse shadow-sm transition hover:bg-accent-primary-hover disabled:opacity-50"
          >
            {actionLoading === "Regenerate start prices"
              ? "Running…"
              : "Regenerate start prices"}
          </button>
          <button
            onClick={() =>
              runAction(
                "/admin/economy/reset-season-prices",
                "Reset season prices",
              )
            }
            disabled={!!actionLoading}
            className="rounded-lg bg-bg-sidebar-active px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-inverse shadow-sm transition hover:bg-accent-warning-hover disabled:opacity-50"
          >
            {actionLoading === "Reset season prices"
              ? "Running…"
              : "Reset season prices"}
          </button>
          <button
            onClick={() =>
              runAction(
                "/admin/economy/process-period-prices",
                "Process period prices",
              )
            }
            disabled={!!actionLoading}
            className="rounded-lg bg-bg-sidebar-active px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-inverse shadow-sm transition hover:bg-bg-sidebar-hover disabled:opacity-50"
          >
            {actionLoading === "Process period prices"
              ? "Running…"
              : "Process period prices"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-4 text-sm ${message.type === "ok" ? "text-accent-success" : "text-accent-danger"}`}
            role="status"
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border-default bg-bg-primary p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Trade Lock
        </h2>
        <p className="mb-5 text-sm text-text-secondary">
          Trading is now controlled manually by admin buttons only.
        </p>
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted-subtle">
          Status:{" "}
          {tradeLocked == null ? "Unknown" : tradeLocked ? "Locked" : "Open"}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => runTradeLockAction("/admin/trade-lock/lock", "Lock trading")}
            disabled={!!actionLoading || tradeLocked === true}
            className="rounded-lg bg-bg-sidebar-active px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-inverse shadow-sm transition hover:bg-accent-danger-hover disabled:opacity-50"
          >
            {actionLoading === "Lock trading" ? "Running…" : "Lock"}
          </button>
          <button
            onClick={() => runTradeLockAction("/admin/trade-lock/open", "Open trading")}
            disabled={!!actionLoading || tradeLocked === false}
            className="rounded-lg bg-bg-sidebar-active px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-inverse shadow-sm transition hover:bg-accent-success-hover disabled:opacity-50"
          >
            {actionLoading === "Open trading" ? "Running…" : "Open"}
          </button>
        </div>
      </section>

      {/* How calculations work */}
      <section className="rounded-xl border border-border-default bg-bg-primary shadow-sm overflow-hidden">
        <details className="group">
          <summary className="list-none cursor-pointer">
            <div className="flex items-center justify-between bg-bg-secondary px-5 py-4 transition hover:bg-bg-tertiary">
              <span className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                How calculations work
              </span>
              <span className="text-text-muted-subtle transition-transform group-open:rotate-180 select-none">
                ▼
              </span>
            </div>
          </summary>
          <div className="border-t border-border-default bg-bg-primary px-5 py-5 text-sm text-text-secondary space-y-4">
            <div>
              <h3 className="font-semibold text-text-secondary mb-1">Base rating</h3>
              <p className="text-text-secondary leading-relaxed">
                We look at this season and last season. Each player gets a score
                based on their stats (goals, assists, saves, etc.), and we turn
                that into a rating from 40–95. The more games they’ve played
                this season, the more we trust this year’s form over last
                year’s.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-secondary mb-1">Start price</h3>
              <p className="text-text-secondary leading-relaxed">
                Everyone gets a price between a floor and a ceiling (goalies in
                a smaller band than skaters). Better ratings mean higher prices.
                We tune the curve so the two most expensive players together sit
                around 5.5–6.5 M—so you can’t stack three superstars and still
                fill the rest of the roster.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-secondary mb-1">
                Current price
              </h3>
              <p className="text-text-secondary leading-relaxed">
                As players earn fantasy points in the current period, their
                price goes up; if they don’t perform, it can go down. “Process
                period prices” applies those changes (with caps so nothing
                swings too wildly). “Reset season prices” just sets everyone
                back to their start price.
              </p>
            </div>
            <p className="text-xs text-text-muted pt-1">
              For formulas and numbers, see{" "}
              <code className="bg-bg-tertiary px-1 rounded">
                docs/economy-calculations.md
              </code>{" "}
              in the repo.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
}
