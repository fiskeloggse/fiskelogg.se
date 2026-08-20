import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import {
  LENGTH_MAX,
  LENGTH_MIN,
  MONTHS,
  SORT_OPTIONS,
  WEIGHT_MAX,
  WEIGHT_MIN,
  getFilteredCatches,
  hasActiveFilters,
  parseRegisterFilters,
  toURLSearchParams,
} from "@/lib/register-catches";
import CatchTabs from "@/app/components/catch-tabs";
import CatchTable from "@/app/components/catch-table";
import DualRangeSlider from "@/app/components/dual-range-slider";

export const metadata: Metadata = {
  title: "Register – Fisklogg",
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const user = await requireUser();
  const rawSearchParams = await props.searchParams;
  const params = toURLSearchParams(rawSearchParams);
  const filters = parseRegisterFilters(params);
  const hasFilters = hasActiveFilters(filters);

  const [speciesSuggestions, catches] = await Promise.all([
    getSpeciesSuggestions(user.id),
    getFilteredCatches(user.id, filters),
  ]);

  const exportHref = `/register/export?${params.toString()}`;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/register" showBingo={user.show_bingo} />

      <form
        method="GET"
        className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
      >
        <details open={hasFilters}>
          <summary className="cursor-pointer text-lg font-semibold">
            Filter
          </summary>

          <div className="mt-4 flex flex-col gap-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Filtrera på art genom att klicka på kolumnrubriken &quot;Art&quot;
              i tabellen nedan.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="from" className="text-sm font-medium">
                  Datum från
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={filters.from}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="to" className="text-sm font-medium">
                  Datum till
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={filters.to}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sort" className="text-sm font-medium">
                  Sortera
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={filters.sort}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <DualRangeSlider
                label="Längd (cm)"
                minName="lengthMin"
                maxName="lengthMax"
                min={LENGTH_MIN}
                max={LENGTH_MAX}
                step={1}
                defaultMinValue={filters.lengthMin}
                defaultMaxValue={filters.lengthMax}
                unit="cm"
              />
              <DualRangeSlider
                label="Vikt (kg)"
                minName="weightMin"
                maxName="weightMax"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={0.1}
                defaultMinValue={filters.weightMin}
                defaultMaxValue={filters.weightMax}
                unit="kg"
              />
            </div>

            <details open>
              <summary className="cursor-pointer text-sm font-medium">
                Fångstmånad
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {MONTHS.map((m) => (
                  <label key={m.value} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="month"
                      value={m.value}
                      defaultChecked={filters.months.includes(m.value)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-full border border-black/10 px-3 py-1 text-sm transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background dark:border-white/15">
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
            </details>

            {filters.species && (
              <input type="hidden" name="species" value={filters.species} />
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Datum från/till och fångstmånad filtrerar på årstid (dag och
              månad) – året spelar ingen roll, så t.ex. 15 nov–15 feb matchar
              varje vinter. Sortering på datum är alltid exakt, år inräknat.
            </p>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Filtrera
              </button>
              {hasFilters && (
                <Link
                  href="/register"
                  className="text-sm text-zinc-500 underline dark:text-zinc-400"
                >
                  Rensa filter
                </Link>
              )}
            </div>
          </div>
        </details>
      </form>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {catches.length} {catches.length === 1 ? "fångst" : "fångster"}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={exportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Exportera
            </a>
            <Link
              href="/register/papperskorg"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Papperskorg
            </Link>
          </div>
        </div>
        <CatchTable
          catches={catches}
          currentUserId={user.id}
          speciesOptions={speciesSuggestions.all}
        />
      </div>
    </main>
  );
}
