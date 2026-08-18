import type { Metadata } from "next";
import Link from "next/link";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import { TIMEZONE } from "@/lib/constants";
import CatchTabs from "@/app/components/catch-tabs";
import CatchList, { type Catch } from "@/app/components/catch-list";
import DualRangeSlider from "@/app/components/dual-range-slider";

export const metadata: Metadata = {
  title: "Register – Fisklogg",
};

const LENGTH_MIN = 0;
const LENGTH_MAX = 150;
const WEIGHT_MIN = 0;
const WEIGHT_MAX = 20;

// Sorterar alltid på hela tidsstämpeln (inklusive år) — till skillnad från
// datum från/till och fångstmånad, som medvetet bortser från år.
const SORT_OPTIONS = [
  { value: "date-desc", label: "Datum, nyast först", column: "caught_at desc" },
  { value: "date-asc", label: "Datum, äldst först", column: "caught_at asc" },
  {
    value: "length-desc",
    label: "Längd, störst först",
    column: "length_cm desc nulls last",
  },
  {
    value: "length-asc",
    label: "Längd, minst först",
    column: "length_cm asc nulls last",
  },
  {
    value: "weight-desc",
    label: "Vikt, tyngst först",
    column: "weight_kg desc nulls last",
  },
  {
    value: "weight-asc",
    label: "Vikt, lättast först",
    column: "weight_kg asc nulls last",
  },
] as const;

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Mars" },
  { value: 4, label: "April" },
  { value: 5, label: "Maj" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Augusti" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

function param(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : "";
}

function paramList(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];
  if (typeof value === "string") return [value];
  return value ?? [];
}

function toMonthDay(dateStr: string): string | null {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(dateStr);
  return match ? `${match[1]}-${match[2]}` : null;
}

export default async function RegisterPage(props: PageProps<"/register">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const species = param(searchParams, "species");
  const from = param(searchParams, "from");
  const to = param(searchParams, "to");
  const lengthMinRaw = param(searchParams, "lengthMin");
  const lengthMaxRaw = param(searchParams, "lengthMax");
  const weightMinRaw = param(searchParams, "weightMin");
  const weightMaxRaw = param(searchParams, "weightMax");
  const lengthMin = lengthMinRaw ? Number(lengthMinRaw) : LENGTH_MIN;
  const lengthMax = lengthMaxRaw ? Number(lengthMaxRaw) : LENGTH_MAX;
  const weightMin = weightMinRaw ? Number(weightMinRaw) : WEIGHT_MIN;
  const weightMax = weightMaxRaw ? Number(weightMaxRaw) : WEIGHT_MAX;
  const sort = param(searchParams, "sort") || "date-desc";
  const months = paramList(searchParams, "month")
    .map(Number)
    .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12);

  const speciesSuggestions = await getSpeciesSuggestions(user.id);

  const speciesCondition = species ? sql`and species = ${species}` : sql``;
  const lengthMinCondition =
    lengthMin > LENGTH_MIN ? sql`and length_cm >= ${lengthMin}` : sql``;
  const lengthMaxCondition =
    lengthMax < LENGTH_MAX ? sql`and length_cm <= ${lengthMax}` : sql``;
  const weightMinCondition =
    weightMin > WEIGHT_MIN ? sql`and weight_kg >= ${weightMin}` : sql``;
  const weightMaxCondition =
    weightMax < WEIGHT_MAX ? sql`and weight_kg <= ${weightMax}` : sql``;
  const monthCondition =
    months.length > 0
      ? sql`and extract(month from caught_at at time zone ${TIMEZONE})::int = any(${sql.array(months)}::int[])`
      : sql``;

  // "Datum från/till" ignores the year — it filters by day-of-year (season),
  // so e.g. 15 nov–15 feb matches every winter regardless of which year.
  const fromMonthDay = toMonthDay(from);
  const toMonthDay_ = toMonthDay(to);
  let dateCondition = sql``;
  if (fromMonthDay && toMonthDay_) {
    dateCondition =
      fromMonthDay <= toMonthDay_
        ? sql`and to_char(caught_at at time zone ${TIMEZONE}, 'MM-DD') between ${fromMonthDay} and ${toMonthDay_}`
        : sql`and (to_char(caught_at at time zone ${TIMEZONE}, 'MM-DD') >= ${fromMonthDay} or to_char(caught_at at time zone ${TIMEZONE}, 'MM-DD') <= ${toMonthDay_})`;
  } else if (fromMonthDay) {
    dateCondition = sql`and to_char(caught_at at time zone ${TIMEZONE}, 'MM-DD') >= ${fromMonthDay}`;
  } else if (toMonthDay_) {
    dateCondition = sql`and to_char(caught_at at time zone ${TIMEZONE}, 'MM-DD') <= ${toMonthDay_}`;
  }

  const sortColumn =
    SORT_OPTIONS.find((option) => option.value === sort)?.column ??
    SORT_OPTIONS[0].column;

  const catches = await sql<Catch[]>`
    select id, user_id, species, length_cm, weight_kg, caught_at
    from catches
    where user_id = ${user.id}
      ${speciesCondition}
      ${lengthMinCondition}
      ${lengthMaxCondition}
      ${weightMinCondition}
      ${weightMaxCondition}
      ${dateCondition}
      ${monthCondition}
    order by ${sql.unsafe(sortColumn)}
  `;

  const hasFilters = Boolean(
    species ||
      from ||
      to ||
      lengthMin > LENGTH_MIN ||
      lengthMax < LENGTH_MAX ||
      weightMin > WEIGHT_MIN ||
      weightMax < WEIGHT_MAX ||
      months.length > 0
  );

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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="species" className="text-sm font-medium">
                  Art
                </label>
                <select
                  id="species"
                  name="species"
                  defaultValue={species}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
                >
                  <option value="">Alla arter</option>
                  {speciesSuggestions.all.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="from" className="text-sm font-medium">
                  Datum från
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={from}
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
                  defaultValue={to}
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
                  defaultValue={sort}
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
                defaultMinValue={lengthMin}
                defaultMaxValue={lengthMax}
                unit="cm"
              />
              <DualRangeSlider
                label="Vikt (kg)"
                minName="weightMin"
                maxName="weightMax"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={0.1}
                defaultMinValue={weightMin}
                defaultMaxValue={weightMax}
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
                      defaultChecked={months.includes(m.value)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-full border border-black/10 px-3 py-1 text-sm transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background dark:border-white/15">
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
            </details>

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
        <h2 className="text-lg font-semibold">
          {catches.length} {catches.length === 1 ? "fångst" : "fångster"}
        </h2>
        <CatchList catches={catches} currentUserId={user.id} />
      </div>
    </main>
  );
}
