import type { FiskepassStats as FiskepassStatsType } from "@/lib/fiskepass";

function formatSv(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

// Ensam/Team split as one bar (solo share, then team share) plus the exact
// values below it -- same visual language as Fiskedagar's per-year bars.
function DistributionBar({
  label,
  soloValue,
  teamValue,
  formatValue,
}: {
  label: string;
  soloValue: number;
  teamValue: number;
  formatValue: (n: number) => string;
}) {
  const total = soloValue + teamValue;
  const soloPct = total > 0 ? (soloValue / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        {total > 0 && (
          <>
            <div className="bg-foreground/70" style={{ width: `${soloPct}%` }} />
            <div className="bg-foreground/30" style={{ width: `${100 - soloPct}%` }} />
          </>
        )}
      </div>
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Ensam: {formatValue(soloValue)}</span>
        <span>Team: {formatValue(teamValue)}</span>
      </div>
    </div>
  );
}

export default function FiskepassStats({ stats }: { stats: FiskepassStatsType }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <h2 className="text-lg font-semibold">Fiskepass</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-2xl font-semibold">{formatSv(stats.totalHours)}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Fiskade timmar</p>
        </div>
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-2xl font-semibold">{stats.antalPass}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Antal pass</p>
        </div>
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-2xl font-semibold">{stats.antalBompass}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Antal bompass</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-black/10 pt-4 dark:border-white/15">
        <DistributionBar
          label="Fördelning antal pass"
          soloValue={stats.antalPassEnsam}
          teamValue={stats.antalPassTeam}
          formatValue={(n) => String(n)}
        />
        <DistributionBar
          label="Total tid"
          soloValue={stats.totalHoursEnsam}
          teamValue={stats.totalHoursTeam}
          formatValue={(n) => `${formatSv(n)} h`}
        />
      </div>
    </div>
  );
}
