import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import TeamPerformanceGraph from "./TeamPerformanceGraph";

export interface StandingsRow {
  teamId: number;
  rank: number;
  previousRank: number;
  name: string;
  manager: string;
  points: number;
  lastNightPoints: number;
  lastDayPoints: number;
  isUser: boolean;
}

interface Props {
  standings: StandingsRow[];
  expandedTeamId: number | null;
  activePeriod: number;
  isFullSeason: boolean;
  showLastNightPoints?: boolean;
  onToggleTeam: (teamId: number) => void;
}

function getMovement(curr: number, prev: number) {
  if (curr < prev) return <span className="text-accent-success">▲</span>;
  if (curr > prev) return <span className="text-accent-danger">▼</span>;
  return <span className="text-text-muted-subtle text-[8px]">●</span>;
}

export default function LeagueStandingsTable({
  standings,
  expandedTeamId,
  activePeriod,
  isFullSeason,
  showLastNightPoints = true,
  onToggleTeam,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-bg-primary border border-border-input shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-bg-sidebar flex justify-between items-center">
        <h2 className="text-xs font-black text-text-inverse uppercase tracking-[0.2em]">
          Rankings
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-bg-secondary">
              <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle">
                Rank
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle">
                Team
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle">
                Manager
              </th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-text-muted-subtle text-center w-28">
                Points
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {standings.map((team) => (
              <Fragment key={team.teamId}>
                <tr
                  className={`transition-colors ${
                    expandedTeamId === team.teamId
                      ? "bg-bg-tertiary"
                      : "hover:bg-bg-secondary"
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg">
                        {team.rank}
                      </span>
                      <span className="text-[8px]">
                        {getMovement(team.rank, team.previousRank)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTeam(team.teamId);
                        }}
                        className="p-1 rounded hover:bg-bg-primary text-text-muted-subtle hover:text-accent-primary transition-colors"
                        title={expandedTeamId === team.teamId ? "Collapse" : "Show stats"}
                        aria-label={expandedTeamId === team.teamId ? "Collapse" : "Expand"}
                      >
                        {expandedTeamId === team.teamId ? "▴" : "▾"}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/team/view/${team.teamId}`, {
                          state: { teamName: team.name, manager: team.manager },
                        });
                      }}
                      className="text-sm font-black uppercase text-text-secondary hover:text-accent-primary hover:underline transition-colors cursor-pointer text-left"
                    >
                      {team.name}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black uppercase text-text-secondary">
                      {team.manager}
                    </span>
                  </td>
                  <td className="px-6 py-4 w-28 text-center">
                    {isFullSeason ? (
                      <span className="font-mono font-black text-lg text-text-primary">
                        {Number(team.points || 0)}
                      </span>
                    ) : showLastNightPoints ? (
                      <span className="inline-flex items-baseline justify-center gap-1">
                        <span className="font-mono font-black text-lg text-text-primary">
                          {Number(team.points ?? 0)}
                        </span>
                        <span className="font-mono text-sm text-text-muted-subtle">
                          ({Number(team.lastNightPoints || 0)})
                        </span>
                      </span>
                    ) : (
                      <span className="font-mono font-black text-lg text-text-primary">
                        {Number(team.points ?? 0)}
                      </span>
                    )}
                  </td>
                </tr>
                {expandedTeamId === team.teamId && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-0 border-b border-border-input"
                    >
                      <TeamPerformanceGraph
                        teamId={team.teamId}
                        periodId={activePeriod}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
