import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getFishingDaysByDate, getLakeBreakdown, getSpeciesBreakdown } from "@/lib/stats";
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
      <StatsDashboard
        speciesBreakdown={speciesBreakdown}
        lakeBreakdown={lakeBreakdown}
        fishingDays={fishingDays}
      />
    </main>
  );
}
