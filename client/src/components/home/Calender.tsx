interface PlannerProps {
  data: Record<
    number,
    { active: number; points: number; budgetChange: string; status: string }
  >;
  today: number;
}

export default function Calender({ data, today }: PlannerProps) {
  return (
    <div className="bg-bg-primary border border-border-strong shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
      <div className="px-4 py-3 bg-bg-sidebar flex justify-between items-center">
        <h2 className="text-xs font-black text-text-inverse uppercase tracking-widest">
          Market Planner
        </h2>
        <div className="px-2 py-0.5 bg-accent-primary text-[10px] font-black text-text-inverse uppercase">
          Phase: Regular Season
        </div>
      </div>

      <div className="grid grid-cols-7 border-collapse">
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const stats = data[day];

          return (
            <div
              key={day}
              className={`h-20 sm:h-24 relative flex flex-col p-2 border-b border-r border-border-default transition-all ${
                isToday ? "bg-bg-secondary" : "bg-bg-primary hover:bg-bg-secondary/50"
              } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-[10px] font-mono font-black ${
                    isToday ? "bg-bg-sidebar text-text-inverse px-1" : "text-text-muted-subtle"
                  }`}
                >
                  {day < 10 ? `0${day}` : day}
                </span>
                {stats?.active > 0 && (
                  <span className="text-[8px] font-black text-accent-primary uppercase italic">
                    {stats.active} Active
                  </span>
                )}
              </div>

              {stats ? (
                <div className="mt-auto space-y-1">
                  <div className="text-[10px] font-bold text-text-secondary">
                    {stats.points > 0 ? `${stats.points} PTS` : "---"}
                  </div>
                  <div
                    className={`text-[9px] font-black px-1 py-0.5 inline-block ${
                      stats.status === "peak"
                        ? "bg-bg-success-muted text-text-success-muted"
                        : stats.status === "high"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-bg-tertiary text-text-muted"
                    }`}
                  >
                    {stats.budgetChange}
                  </div>
                </div>
              ) : (
                <div className="mt-auto h-1 bg-bg-secondary w-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
