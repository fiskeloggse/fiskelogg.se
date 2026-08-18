import type { Metadata } from "next";
import Link from "next/link";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import { TIMEZONE } from "@/lib/constants";
import CatchTabs from "@/app/components/catch-tabs";
import CatchList, { type Catch } from "@/app/components/catch-list";

export const metadata: Metadata = {
  title: "Register – Fisklogg",
};

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

function param(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : "";
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
  const lengthMin = param(searchParams, "lengthMin");
  const lengthMax = param(searchParams, "lengthMax");
  const weightMin = param(searchParams, "weightMin");
  const weightMax = param(searchParams, "weightMax");
  const sort = param(searchParams, "sort") || "date-desc";

  const speciesSuggestions = await getSpeciesSuggestions(user.id);

  const speciesCondition = species ? sql`and species = ${species}` : sql``;
  const lengthMinCondition = lengthMin
    ? sql`and length_cm >= ${Number(lengthMin)}`
    : sql``;
  const lengthMaxCondition = lengthMax
    ? sql`and length_cm <= ${Number(lengthMax)}`
    : sql``;
  const weightMinCondition = weightMin
    ? sql`and weight_kg >= ${Number(weightMin)}`
    : sql``;
  const weightMaxCondition = weightMax
    ? sql`and weight_kg <= ${Number(weightMax)}`
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
    order by ${sql.unsafe(sortColumn)}
  `;

  const hasFilters = Boolean(
    species || from || to || lengthMin || lengthMax || weightMin || weightMax
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/register" />

      <form
        method="GET"
        className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
      >
        <h2 className="text-lg font-semibold">Filter</h2>

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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lengthMin" className="text-sm font-medium">
              Längd från (cm)
            </label>
            <input
              id="lengthMin"
              name="lengthMin"
              type="number"
              step="0.1"
              min="0"
              defaultValue={lengthMin}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lengthMax" className="text-sm font-medium">
              Längd till (cm)
            </label>
            <input
              id="lengthMax"
              name="lengthMax"
              type="number"
              step="0.1"
              min="0"
              defaultValue={lengthMax}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="weightMin" className="text-sm font-medium">
              Vikt från (kg)
            </label>
            <input
              id="weightMin"
              name="weightMin"
              type="number"
              step="0.01"
              min="0"
              defaultValue={weightMin}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="weightMax" className="text-sm font-medium">
              Vikt till (kg)
            </label>
            <input
              id="weightMax"
              name="weightMax"
              type="number"
              step="0.01"
              min="0"
              defaultValue={weightMax}
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Datum från/till filtrerar på årstid (dag och månad) – året spelar ingen
          roll, så t.ex. 15 nov–15 feb matchar varje vinter.
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
