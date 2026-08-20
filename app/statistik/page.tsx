import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getFishingDaysByYearMonth, getStatsSummary } from "@/lib/stats";
import CatchTabs from "@/app/components/catch-tabs";
import FishingDaysChart from "@/app/components/fishing-days-chart";

export const metadata: Metadata = {
  title: "Statistik – Fisklogg",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export default async function StatistikPage() {
  const user = await requireUser();

  const [summary, fishingDaysByYearMonth] = await Promise.all([
    getStatsSummary(user.id, user.team_id),
    getFishingDaysByYearMonth(user.id, user.team_id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/statistik" showBingo={user.show_bingo} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Antal arter" value={summary.species} />
        <StatCard label="Antal sjöar" value={summary.lakes} />
        <StatCard label="Antal fiskedagar" value={summary.fishingDays} />
        <StatCard label="Antal fiskar" value={summary.catches} />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <FishingDaysChart data={fishingDaysByYearMonth} />
      </div>
    </main>
  );
}
