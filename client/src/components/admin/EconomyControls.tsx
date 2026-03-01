import { useState } from "react";
import api from "../../lib/api";

export default function EconomyControls() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

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

  return (
    <div className="max-w-2xl space-y-8">
      {/* Actions */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-700">
          Actions
        </h2>
        <p className="mb-5 text-sm text-slate-600">
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
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
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
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
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
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
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
            className="rounded-lg bg-slate-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-600 disabled:opacity-50"
          >
            {actionLoading === "Process period prices"
              ? "Running…"
              : "Process period prices"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-4 text-sm ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}
            role="status"
          >
            {message.text}
          </p>
        )}
      </section>

      {/* How calculations work */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <details className="group">
          <summary className="list-none cursor-pointer">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 transition hover:bg-slate-100">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                How calculations work
              </span>
              <span className="text-slate-400 transition-transform group-open:rotate-180 select-none">
                ▼
              </span>
            </div>
          </summary>
          <div className="border-t border-slate-200 bg-white px-5 py-5 text-sm text-slate-700 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Base rating</h3>
              <p className="text-slate-600 leading-relaxed">
                We look at this season and last season. Each player gets a score
                based on their stats (goals, assists, saves, etc.), and we turn
                that into a rating from 40–95. The more games they’ve played
                this season, the more we trust this year’s form over last
                year’s.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Start price</h3>
              <p className="text-slate-600 leading-relaxed">
                Everyone gets a price between a floor and a ceiling (goalies in
                a smaller band than skaters). Better ratings mean higher prices.
                We tune the curve so the two most expensive players together sit
                around 5.5–6.5 M—so you can’t stack three superstars and still
                fill the rest of the roster.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                Current price
              </h3>
              <p className="text-slate-600 leading-relaxed">
                As players earn fantasy points in the current period, their
                price goes up; if they don’t perform, it can go down. “Process
                period prices” applies those changes (with caps so nothing
                swings too wildly). “Reset season prices” just sets everyone
                back to their start price.
              </p>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              For formulas and numbers, see{" "}
              <code className="bg-slate-100 px-1 rounded">
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
