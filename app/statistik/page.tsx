import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { STATS_WIDGET_KEYS, type StatsWidgetKey } from "@/lib/constants";
import {
  getStatsBestDay,
  getStatsLeaderboard,
  getStatsMonthly,
  getStatsPerLake,
  getStatsPerSpecies,
  getStatsStreak,
  getStatsTotals,
  type StatsBestDay,
  type StatsLakeRow,
  type StatsLeaderboardRow,
  type StatsMonthRow,
  type StatsSpeciesRow,
  type StatsTotals,
} from "@/lib/stats";
import CatchTabs from "@/app/components/catch-tabs";
import StatsSettingsForm from "@/app/components/stats-settings-form";
import {
  BestDayWidget,
  LakesWidget,
  LeaderboardWidget,
  MonthlyWidget,
  SpeciesWidget,
  StreakWidget,
  TotalsWidget,
} from "@/app/components/stats-widgets";

export const metadata: Metadata = {
  title: "Statistik – Fisklogg",
};

export default async function StatistikPage() {
  const user = await requireUser();
  const selected: readonly StatsWidgetKey[] =
    (user.stats_widgets as StatsWidgetKey[] | null) ?? STATS_WIDGET_KEYS;
  const has = (key: StatsWidgetKey) => selected.includes(key);

  const [totals, species, monthly, lakes, leaderboard, streak, bestDay] =
    await Promise.all([
      has("totals")
        ? getStatsTotals(user.id, user.team_id)
        : Promise.resolve(null as StatsTotals | null),
      has("species")
        ? getStatsPerSpecies(user.id, user.team_id)
        : Promise.resolve(null as StatsSpeciesRow[] | null),
      has("monthly")
        ? getStatsMonthly(user.id, user.team_id)
        : Promise.resolve(null as StatsMonthRow[] | null),
      has("lakes")
        ? getStatsPerLake(user.id, user.team_id)
        : Promise.resolve(null as StatsLakeRow[] | null),
      has("leaderboard") && user.team_id
        ? getStatsLeaderboard(user.team_id)
        : Promise.resolve(null as StatsLeaderboardRow[] | null),
      has("streak")
        ? getStatsStreak(user.id, user.team_id)
        : Promise.resolve(null as number | null),
      has("bestday")
        ? getStatsBestDay(user.id, user.team_id)
        : Promise.resolve(null as StatsBestDay | undefined),
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

      <StatsSettingsForm selected={selected} />

      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Inga widgets valda. Öppna &quot;Anpassa vy&quot; ovan för att välja
          vad du vill visa.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {totals && <TotalsWidget totals={totals} />}
          {species && <SpeciesWidget rows={species} />}
          {monthly && <MonthlyWidget rows={monthly} />}
          {lakes && <LakesWidget rows={lakes} />}
          {has("leaderboard") && (
            <LeaderboardWidget
              rows={leaderboard ?? []}
              hasTeam={!!user.team_id}
            />
          )}
          {streak != null && <StreakWidget days={streak} />}
          {has("bestday") && <BestDayWidget day={bestDay ?? null} />}
        </div>
      )}
    </main>
  );
}
