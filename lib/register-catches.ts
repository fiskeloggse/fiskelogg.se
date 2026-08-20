import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";
import type { Catch } from "@/app/components/catch-list";

export const LENGTH_MIN = 0;
export const LENGTH_MAX = 150;
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 20;

// Sorterar alltid på hela tidsstämpeln (inklusive år) — till skillnad från
// datum från/till och fångstmånad, som medvetet bortser från år.
export const SORT_OPTIONS = [
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

export const MONTHS = [
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

export type RegisterFilters = {
  species: string;
  from: string;
  to: string;
  lengthMin: number;
  lengthMax: number;
  weightMin: number;
  weightMax: number;
  sort: string;
  months: number[];
};

export function toURLSearchParams(
  input: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.append(key, value);
    }
  }
  return params;
}

export function parseRegisterFilters(params: URLSearchParams): RegisterFilters {
  const lengthMinRaw = params.get("lengthMin");
  const lengthMaxRaw = params.get("lengthMax");
  const weightMinRaw = params.get("weightMin");
  const weightMaxRaw = params.get("weightMax");

  return {
    species: params.get("species") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    lengthMin: lengthMinRaw ? Number(lengthMinRaw) : LENGTH_MIN,
    lengthMax: lengthMaxRaw ? Number(lengthMaxRaw) : LENGTH_MAX,
    weightMin: weightMinRaw ? Number(weightMinRaw) : WEIGHT_MIN,
    weightMax: weightMaxRaw ? Number(weightMaxRaw) : WEIGHT_MAX,
    sort: params.get("sort") || "date-desc",
    months: params
      .getAll("month")
      .map(Number)
      .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12),
  };
}

export function hasActiveFilters(filters: RegisterFilters): boolean {
  return Boolean(
    filters.species ||
      filters.from ||
      filters.to ||
      filters.lengthMin > LENGTH_MIN ||
      filters.lengthMax < LENGTH_MAX ||
      filters.weightMin > WEIGHT_MIN ||
      filters.weightMax < WEIGHT_MAX ||
      filters.months.length > 0
  );
}

function toMonthDay(dateStr: string): string | null {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(dateStr);
  return match ? `${match[1]}-${match[2]}` : null;
}

export async function getFilteredCatches(
  userId: number,
  filters: RegisterFilters
): Promise<Catch[]> {
  const speciesCondition = filters.species
    ? sql`and species = ${filters.species}`
    : sql``;
  const lengthMinCondition =
    filters.lengthMin > LENGTH_MIN ? sql`and length_cm >= ${filters.lengthMin}` : sql``;
  const lengthMaxCondition =
    filters.lengthMax < LENGTH_MAX ? sql`and length_cm <= ${filters.lengthMax}` : sql``;
  const weightMinCondition =
    filters.weightMin > WEIGHT_MIN ? sql`and weight_kg >= ${filters.weightMin}` : sql``;
  const weightMaxCondition =
    filters.weightMax < WEIGHT_MAX ? sql`and weight_kg <= ${filters.weightMax}` : sql``;
  const monthCondition =
    filters.months.length > 0
      ? sql`and extract(month from caught_at at time zone ${TIMEZONE})::int = any(${sql.array(filters.months)}::int[])`
      : sql``;

  // "Datum från/till" ignores the year — it filters by day-of-year (season),
  // so e.g. 15 nov–15 feb matches every winter regardless of which year.
  const fromMonthDay = toMonthDay(filters.from);
  const toMonthDay_ = toMonthDay(filters.to);
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
    SORT_OPTIONS.find((option) => option.value === filters.sort)?.column ??
    SORT_OPTIONS[0].column;

  return sql<Catch[]>`
    select id, user_id, species, length_cm, weight_kg, lake, location, bait, caught_at
    from catches
    where user_id = ${userId}
      and deleted_at is null
      ${speciesCondition}
      ${lengthMinCondition}
      ${lengthMaxCondition}
      ${weightMinCondition}
      ${weightMaxCondition}
      ${dateCondition}
      ${monthCondition}
    order by ${sql.unsafe(sortColumn)}
  `;
}
