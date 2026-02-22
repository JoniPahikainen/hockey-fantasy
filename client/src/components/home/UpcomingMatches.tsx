export interface UpcomingMatchesProps {
  match_data: any[];
  nextGamesMatches?: any[];
  nextGamesLabel?: string;
}

export default function UpcomingMatches({
  match_data,
  nextGamesMatches = [],
  nextGamesLabel = "",
}: UpcomingMatchesProps) {
  const hasToday = match_data.length > 0;
  const hasNextGames = nextGamesMatches.length > 0 && nextGamesLabel;
  const list = hasToday ? match_data : hasNextGames ? nextGamesMatches : [];

  return (
    <div className="bg-white border border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 flex justify-between items-center">
        <h2 className="text-xs font-black text-white uppercase tracking-widest">
          Night Schedule
        </h2>
      </div>

      {!hasToday && hasNextGames && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">
            No games today. Games start again {nextGamesLabel}.
          </p>
        </div>
      )}

      <div className="flex flex-col divide-y divide-slate-100">
        {list.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              No games today. Check back later for the next slate.
            </p>
          </div>
        ) : (
          list.map((match, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 w-8">
                    {match.away_team_abbrev}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">@</span>
                  <span className="text-sm font-black text-slate-900 w-8">
                    {match.home_team_abbrev}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-black text-slate-900">
                  {match.time}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {match.date}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
        <button className="w-full text-[9px] font-black text-slate-500 uppercase hover:text-slate-900">
          View Full TV Schedule
        </button>
      </div>
    </div>
  );
}
