import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import FormationCard from "../components/team/FormationCard";
import api from "../lib/api";

export default function TeamViewPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const state = location.state as { teamName?: string; manager?: string } | undefined;

  const [lineup, setLineup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeLockMeta, setTradeLockMeta] = useState<string | null>(null);

  const teamName = state?.teamName ?? "Team";
  const manager = state?.manager ?? "—";

  useEffect(() => {
    if (!teamId) return;
    const id = Number(teamId);
    if (Number.isNaN(id)) {
      setError("Invalid team");
      setLoading(false);
      return;
    }
    const fetchTeam = async () => {
      try {
        const lockRes = await api.get("/fantasy-teams/trade-lock/status");
        const isLocked = Boolean(lockRes.data?.status?.locked);
        const lastLockAt = lockRes.data?.status?.last_lock_at as string | null;
        setTradeLockMeta(
          isLocked
            ? `Live roster (trading locked: ${lockRes.data?.status?.reason ?? "locked"})`
            : lastLockAt
              ? `Snapshot from last trade lock: ${new Date(lastLockAt).toLocaleString()}`
              : `Snapshot from last trade lock: n/a`,
        );
        const rosterEndpoint = isLocked
          ? `/fantasy-teams/${id}/players`
          : `/fantasy-teams/${id}/players/last-trade-lock`;

        const res = await api.get(rosterEndpoint);
        if (!res.data.ok) {
          setError("Team not found");
          return;
        }

        const p = res.data.players.map((x: any) => ({ ...x, id: x.player_id }));
        setLineup(p);
      } catch {
        setError("Failed to load team");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  const totalSalary = lineup.reduce((s, p) => s + (Number(p.salary) || 0), 0);
  const captainId = lineup.find((p: any) => p.is_captain)?.id ?? null;

  if (loading) {
    return (
      <div className="flex h-screen bg-bg-secondary text-text-primary">
        <Sidebar />
        <div className="ml-16 p-8 flex-1">Loading team…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-bg-secondary text-text-primary">
        <Sidebar />
        <div className="ml-16 p-8 flex-1">
          <p className="text-accent-danger">{error}</p>
          <Link to="/league" className="text-accent-primary hover:underline mt-2 inline-block">Back to league</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-secondary text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-16 overflow-hidden">
        {/* Header: team name, manager, salary, slots */}
        <div className="px-6 pt-8 pb-4 bg-bg-primary z-10 border-b border-border-default">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-text-primary leading-none">
              Team View
            </h1>
            {tradeLockMeta && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted-subtle">
                  {tradeLockMeta}
                </p>
              </div>
            )}
            <Link
              to="/league"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-subtle hover:text-accent-primary transition-colors"
            >
              ← League
            </Link>
          </div>
          <div className="flex items-center gap-10 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">Team</span>
              <span className="font-black text-sm text-text-primary uppercase">{teamName}</span>
            </div>
            <div className="w-px h-8 bg-bg-tertiary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">Manager</span>
              <span className="font-black text-sm text-text-primary uppercase">{manager}</span>
            </div>
            <div className="w-px h-8 bg-bg-tertiary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">Salary used</span>
              <span className="font-mono font-black text-lg text-text-primary">
                ${Number(totalSalary || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-px h-8 bg-bg-tertiary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-text-muted-subtle uppercase tracking-widest">Slots</span>
              <span className="font-mono font-black text-lg text-text-primary">{lineup.length} / 6</span>
            </div>
          </div>
        </div>

        {/* Formation (read-only) */}
        <div className="p-8 bg-bg-tertiary border-b border-border-input overflow-y-auto">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <FormationCard
                  key={`f-${i}`}
                  label="FWD"
                  readOnly
                  isCaptain={lineup.filter((p) => p.pos === "F")[i]?.id === captainId}
                  player={lineup.filter((p) => p.pos === "F")[i]}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
              {[0, 1].map((i) => (
                <FormationCard
                  key={`d-${i}`}
                  label="DEF"
                  readOnly
                  isCaptain={lineup.filter((p) => p.pos === "D")[i]?.id === captainId}
                  player={lineup.filter((p) => p.pos === "D")[i]}
                />
              ))}
            </div>
            <div className="max-w-xs mx-auto w-full">
              <FormationCard
                label="GOALIE"
                isGoalie
                readOnly
                isCaptain={lineup.find((p) => p.pos === "G")?.id === captainId}
                player={lineup.find((p) => p.pos === "G")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
