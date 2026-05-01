import { useEffect, useState } from "react";
import api from "../../lib/api";

interface Team {
  id: number;
  abbrev: string;
  name?: { default?: string };
  commonName?: { default?: string };
  logo?: string;
  darkLogo?: string;
}

interface Series {
  seriesTitle: string;
  seriesAbbrev: string;
  seriesLetter: string;
  playoffRound: number;
  topSeedRank?: number;
  topSeedRankAbbrev?: string;
  topSeedWins: number;
  bottomSeedRank?: number;
  bottomSeedRankAbbrev?: string;
  bottomSeedWins: number;
  winningTeamId?: number;
  losingTeamId?: number;
  topSeedTeam?: Team;
  bottomSeedTeam?: Team;
}

interface Bracket {
  bracketLogo?: string;
  series: Series[];
}

const WINS_TO_CLINCH = 4;

const isRealTeam = (t?: Team): t is Team =>
  Boolean(t && typeof t.id === "number" && t.id > 0);

const seriesHasTeams = (s: Series): boolean =>
  isRealTeam(s.topSeedTeam) || isRealTeam(s.bottomSeedTeam);

type SeedSide = "top" | "bottom";

function getSeedState(s: Series, side: SeedSide) {
  const team = side === "top" ? s.topSeedTeam : s.bottomSeedTeam;
  const wins = side === "top" ? s.topSeedWins : s.bottomSeedWins;
  const otherWins = side === "top" ? s.bottomSeedWins : s.topSeedWins;
  const teamId = team?.id ?? -1;

  let status: "won" | "lost" | "leading" | "trailing" | "even" | "tbd" = "tbd";
  if (!isRealTeam(team)) {
    status = "tbd";
  } else if (s.winningTeamId === teamId) {
    status = "won";
  } else if (s.losingTeamId === teamId) {
    status = "lost";
  } else if (wins > otherWins) {
    status = "leading";
  } else if (wins < otherWins) {
    status = "trailing";
  } else {
    status = "even";
  }

  return { team, wins, status };
}

function SeedRow({
  team,
  wins,
  status,
  rankAbbrev,
}: {
  team?: Team;
  wins: number;
  status: ReturnType<typeof getSeedState>["status"];
  rankAbbrev?: string;
}) {
  const tone =
    status === "won"
      ? "bg-bg-success-muted border-l-4 border-l-accent-success"
      : status === "lost"
      ? "bg-bg-danger-muted border-l-4 border-l-accent-danger opacity-70"
      : status === "leading"
      ? "border-l-4 border-l-accent-primary/70"
      : status === "trailing"
      ? "border-l-4 border-l-transparent opacity-80"
      : "border-l-4 border-l-transparent";

  const winsTone =
    status === "won"
      ? "text-accent-success"
      : status === "lost"
      ? "text-accent-danger"
      : status === "leading"
      ? "text-text-primary"
      : "text-text-muted";

  const nameTone =
    status === "lost"
      ? "text-text-muted line-through decoration-accent-danger/60"
      : status === "won"
      ? "text-text-primary"
      : "text-text-secondary";

  const abbrev = team?.abbrev ?? "TBD";
  const isTbd = !isRealTeam(team);

  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-1.5 ${tone}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {!isTbd && team?.logo ? (
          <img
            src={team.logo}
            alt={abbrev}
            className="w-6 h-6 object-contain flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-6 h-6 rounded-sm bg-bg-tertiary flex-shrink-0" />
        )}
        <div className="flex flex-col min-w-0">
          <span
            className={`text-[10px] font-black uppercase leading-none ${nameTone}`}
          >
            {abbrev}
          </span>
          {rankAbbrev && (
            <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted-subtle leading-none mt-0.5">
              {rankAbbrev}
            </span>
          )}
        </div>
      </div>
      <span
        className={`font-mono font-black text-sm tabular-nums ${winsTone}`}
      >
        {isTbd ? "—" : wins}
      </span>
    </div>
  );
}

function SeriesCard({ series }: { series: Series }) {
  const top = getSeedState(series, "top");
  const bottom = getSeedState(series, "bottom");

  const isLive =
    seriesHasTeams(series) &&
    series.winningTeamId == null &&
    (series.topSeedWins > 0 || series.bottomSeedWins > 0) &&
    series.topSeedWins < WINS_TO_CLINCH &&
    series.bottomSeedWins < WINS_TO_CLINCH;

  const isFinal = series.winningTeamId != null;

  const statusLabel = isFinal
    ? "Final"
    : isLive
    ? "Live"
    : seriesHasTeams(series)
    ? "Upcoming"
    : "TBD";

  const statusTone = isFinal
    ? "text-accent-success"
    : isLive
    ? "text-accent-warning"
    : "text-text-muted-subtle";

  return (
    <div className="bg-bg-primary border border-border-default shadow-sm w-full overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 bg-bg-tertiary border-b border-border-subtle">
        <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">
          {series.seriesAbbrev}-{series.seriesLetter}
        </span>
        <span
          className={`text-[8px] font-black uppercase tracking-widest ${statusTone}`}
        >
          {statusLabel}
        </span>
      </div>
      <SeedRow
        team={top.team}
        wins={top.wins}
        status={top.status}
        rankAbbrev={series.topSeedRankAbbrev}
      />
      <div className="border-t border-border-subtle" />
      <SeedRow
        team={bottom.team}
        wins={bottom.wins}
        status={bottom.status}
        rankAbbrev={series.bottomSeedRankAbbrev}
      />
    </div>
  );
}

function RoundColumn({
  title,
  series,
}: {
  title: string;
  series: Series[];
}) {
  return (
    <div className="flex flex-col gap-3 min-w-[140px] flex-1">
      <div className="text-[9px] font-black uppercase tracking-widest text-text-muted-subtle text-center">
        {title}
      </div>
      <div
        className="flex flex-col flex-1 justify-around gap-3"
      >
        {series.length === 0 ? (
          <div className="text-[9px] italic text-text-muted-subtle text-center">
            TBD
          </div>
        ) : (
          series.map((s) => <SeriesCard key={s.seriesLetter} series={s} />)
        )}
      </div>
    </div>
  );
}

export default function PlayoffBracket() {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBracket = async () => {
      try {
        const { data } = await api.get("/nhl/playoff-bracket");
        if (data.ok && data.bracket && Array.isArray(data.bracket.series)) {
          setBracket(data.bracket as Bracket);
        } else {
          setBracket(null);
        }
      } catch (err) {
        console.error("Failed to load playoff bracket:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBracket();
  }, []);

  if (loading || error || !bracket || !Array.isArray(bracket.series)) {
    return null;
  }

  const playoffsActive = bracket.series.some(seriesHasTeams);
  if (!playoffsActive) return null;

  const round1 = bracket.series.filter((s) => s.playoffRound === 1);
  const round2 = bracket.series.filter(
    (s) => s.playoffRound === 2 && s.seriesAbbrev === "R2",
  );
  const conf = bracket.series.filter((s) => s.seriesAbbrev === "CF");
  const cup = bracket.series.filter((s) => s.seriesAbbrev === "SCF");

  return (
    <div className="bg-bg-primary border border-border-input shadow-sm w-full">
      <div className="px-6 py-4 bg-bg-sidebar flex justify-between items-center">
        <h2 className="text-xs font-black text-text-inverse uppercase tracking-[0.2em]">
          Stanley Cup{" "}
          <span className="text-text-muted-subtle">Playoffs</span>
        </h2>
        {bracket.bracketLogo && (
          <img
            src={bracket.bracketLogo}
            alt="Playoffs"
            className="h-6 object-contain opacity-90"
            loading="lazy"
          />
        )}
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 items-stretch min-w-[640px]">
          <RoundColumn title="1st Round" series={round1} />
          <RoundColumn title="2nd Round" series={round2} />
          <RoundColumn title="Conf. Finals" series={conf} />
          <RoundColumn title="Stanley Cup" series={cup} />
        </div>
      </div>
      <div className="bg-bg-secondary px-4 py-3 border-t border-border-default flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Legend color="bg-accent-success" label="Series Won" />
        <Legend color="bg-accent-danger" label="Eliminated" />
        <Legend color="bg-accent-primary/70" label="Leading" />
        <Legend color="bg-accent-warning" label="Live" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 ${color}`} />
      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
