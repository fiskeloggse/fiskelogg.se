import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import {
  getCatchesWithPosition,
  getFishingDaysByDate,
  getLakeStats,
  getSpeciesBreakdown,
} from "@/lib/stats";
import { getPersonalBests } from "@/lib/personal-bests";
import { getFiskepassStats } from "@/lib/fiskepass";
import StatsDashboard from "@/app/components/stats-dashboard";
import FiskepassStats from "@/app/components/fiskepass-stats";

export const metadata: Metadata = {
  title: "Statistik – Fisklogg",
};

export default async function StatistikPage(props: PageProps<"/statistik">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const initialExpanded =
    searchParams.expand === "species" || searchParams.expand === "personalbests"
      ? "species"
      : searchParams.expand === "lakes"
        ? "lakes"
        : searchParams.expand === "fishingdays"
          ? "fishingdays"
          : null;

  const [speciesBreakdown, lakeStats, fishingDays, personalBests, mappedCatches, fiskepassStats] =
    await Promise.all([
      getSpeciesBreakdown(user.id),
      getLakeStats(user.id),
      getFishingDaysByDate(user.id),
      getPersonalBests(user.id),
      getCatchesWithPosition(user.id),
      user.show_fiskepass ? getFiskepassStats(user.id) : Promise.resolve(null),
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
      {user.show_fiskepass && fiskepassStats && <FiskepassStats stats={fiskepassStats} />}
    </main>
  );
}
