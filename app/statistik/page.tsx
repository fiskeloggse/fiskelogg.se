import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getFishingDaysByDate, getLakeBreakdown, getSpeciesBreakdown } from "@/lib/stats";
import CatchTabs from "@/app/components/catch-tabs";
import StatsDashboard from "@/app/components/stats-dashboard";

export const metadata: Metadata = {
  title: "Statistik – Fisklogg",
};

export default async function StatistikPage() {
  const user = await requireUser();

  const [speciesBreakdown, lakeBreakdown, fishingDays] = await Promise.all([
    getSpeciesBreakdown(user.id, user.team_id),
    getLakeBreakdown(user.id, user.team_id),
    getFishingDaysByDate(user.id, user.team_id),
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

      <StatsDashboard
        speciesBreakdown={speciesBreakdown}
        lakeBreakdown={lakeBreakdown}
        fishingDays={fishingDays}
      />
    </main>
  );
}
