import type { FiskepassStats as FiskepassStatsType } from "@/lib/fiskepass";

function formatSv(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
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
    </div>
  );
}
