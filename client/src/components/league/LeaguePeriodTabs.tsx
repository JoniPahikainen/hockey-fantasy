import { useEffect, useState } from "react";
import api from "../../lib/api";

interface Props {
  activePeriod: number;
  currentPeriod: number | null;
  onSelectPeriod: (periodId: number) => void;
}

export default function LeaguePeriodTabs({
  activePeriod,
  currentPeriod,
  onSelectPeriod,
}: Props) {
  const [periods, setPeriods] = useState<
    { id: number; label: string; status: "past" | "current" | "locked" }[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await api.get("/leagues/periods");
        if (res.data?.ok && Array.isArray(res.data.periods)) {
          setPeriods(
            res.data.periods.map((p: any) => ({
              id: Number(p.period_id),
              label: String(p.period_name),
              status: p.status as "past" | "current" | "locked",
            })),
          );
        }
      } catch (e) {
        console.error("Failed to fetch periods:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPeriods();
  }, []);

  const fullSeasonTab = {
    id: 6,
    label: "Full Season",
    status: "current" as const,
  };

  const tabs = [...periods, fullSeasonTab];

  return (
    <div className="flex gap-1 border-b border-border-default pb-4 overflow-x-auto">
      {loading ? (
        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted-subtle">
          Loading periods…
        </div>
      ) : tabs.map((p) => {
        const isActive = activePeriod === p.id;
        const isLocked =
          p.id === 6
            ? false
            : p.status === "locked" ||
              (currentPeriod !== null && p.id > currentPeriod);
        return (
          <button
            key={p.id}
            disabled={isLocked}
            onClick={() => onSelectPeriod(p.id)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors
              ${isActive ? "bg-bg-sidebar text-text-inverse" : "text-text-muted-subtle hover:text-text-primary"}
              ${isLocked ? "opacity-20 cursor-not-allowed" : ""}
            `}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
