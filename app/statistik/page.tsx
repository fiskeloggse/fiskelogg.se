import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import {
  getCatchesWithPosition,
  getFishingDaysByDate,
  getLakeStats,
  getSpeciesBreakdown,
} from "@/lib/stats";
import { getPersonalBests } from "@/lib/personal-bests";
import StatsDashboard from "@/app/components/stats-dashboard";

export const metadata: Metadata = {
  title: "Statistik – Fisklogg",
};

export default async function StatistikPage(props: PageProps<"/statistik">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const initialExpanded =
    searchParams.expand === "species" || searchParams.expand === "personalbests"
      ? "species"
      : null;

  const [speciesBreakdown, lakeStats, fishingDays, personalBests, mappedCatches] =
    await Promise.all([
      getSpeciesBreakdown(user.id),
      getLakeStats(user.id),
      getFishingDaysByDate(user.id),
      getPersonalBests(user.id),
      getCatchesWithPosition(user.id),
    ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <StatsDashboard
        speciesBreakdown={speciesBreakdown}
        lakeStats={lakeStats}
        fishingDays={fishingDays}
        personalBests={personalBests}
        mappedCatches={mappedCatches}
        initialExpanded={initialExpanded}
      />
    </main>
  );
}
