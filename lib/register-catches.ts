import "server-only";
import sql from "./db";
import {
  LENGTH_MAX,
  LENGTH_MIN,
  TIMEZONE,
  WEIGHT_MAX,
  WEIGHT_MIN,
  WEATHER_TEMP_MIN,
  WEATHER_TEMP_MAX,
  WEATHER_WIND_MIN,
  WEATHER_WIND_MAX,
  WEATHER_PRESSURE_MIN,
  WEATHER_PRESSURE_MAX,
} from "./constants";
import type { Catch } from "@/app/components/catch-list";

export { LENGTH_MIN, LENGTH_MAX, WEIGHT_MIN, WEIGHT_MAX };

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

export type RegisterFilters = {
  species: string;
  lake: string;
  bait: string;
  from: string;
  to: string;
  lengthMin: number;
  lengthMax: number;
  weightMin: number;
  weightMax: number;
  weatherTempMin: number;
  weatherTempMax: number;
  weatherWindMin: number;
  weatherWindMax: number;
  weatherPressureMin: number;
  weatherPressureMax: number;
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
  const weatherTempMinRaw = params.get("weatherTempMin");
  const weatherTempMaxRaw = params.get("weatherTempMax");
  const weatherWindMinRaw = params.get("weatherWindMin");
  const weatherWindMaxRaw = params.get("weatherWindMax");
  const weatherPressureMinRaw = params.get("weatherPressureMin");
  const weatherPressureMaxRaw = params.get("weatherPressureMax");

  return {
    species: params.get("species") ?? "",
    lake: params.get("lake") ?? "",
    bait: params.get("bait") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    lengthMin: lengthMinRaw ? Number(lengthMinRaw) : LENGTH_MIN,
    lengthMax: lengthMaxRaw ? Number(lengthMaxRaw) : LENGTH_MAX,
    weightMin: weightMinRaw ? Number(weightMinRaw) : WEIGHT_MIN,
    weightMax: weightMaxRaw ? Number(weightMaxRaw) : WEIGHT_MAX,
    weatherTempMin: weatherTempMinRaw ? Number(weatherTempMinRaw) : WEATHER_TEMP_MIN,
    weatherTempMax: weatherTempMaxRaw ? Number(weatherTempMaxRaw) : WEATHER_TEMP_MAX,
    weatherWindMin: weatherWindMinRaw ? Number(weatherWindMinRaw) : WEATHER_WIND_MIN,
    weatherWindMax: weatherWindMaxRaw ? Number(weatherWindMaxRaw) : WEATHER_WIND_MAX,
    weatherPressureMin: weatherPressureMinRaw
      ? Number(weatherPressureMinRaw)
      : WEATHER_PRESSURE_MIN,
    weatherPressureMax: weatherPressureMaxRaw
      ? Number(weatherPressureMaxRaw)
      : WEATHER_PRESSURE_MAX,
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
      filters.lake ||
      filters.bait ||
      filters.from ||
      filters.to ||
      filters.lengthMin > LENGTH_MIN ||
      filters.lengthMax < LENGTH_MAX ||
      filters.weightMin > WEIGHT_MIN ||
      filters.weightMax < WEIGHT_MAX ||
      filters.weatherTempMin > WEATHER_TEMP_MIN ||
      filters.weatherTempMax < WEATHER_TEMP_MAX ||
      filters.weatherWindMin > WEATHER_WIND_MIN ||
      filters.weatherWindMax < WEATHER_WIND_MAX ||
      filters.weatherPressureMin > WEATHER_PRESSURE_MIN ||
      filters.weatherPressureMax < WEATHER_PRESSURE_MAX ||
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
  const lakeCondition = filters.lake ? sql`and lake = ${filters.lake}` : sql``;
  const baitCondition = filters.bait ? sql`and bait = ${filters.bait}` : sql``;
  const lengthMinCondition =
    filters.lengthMin > LENGTH_MIN ? sql`and length_cm >= ${filters.lengthMin}` : sql``;
  const lengthMaxCondition =
    filters.lengthMax < LENGTH_MAX ? sql`and length_cm <= ${filters.lengthMax}` : sql``;
  const weightMinCondition =
    filters.weightMin > WEIGHT_MIN ? sql`and weight_kg >= ${filters.weightMin}` : sql``;
  const weightMaxCondition =
    filters.weightMax < WEIGHT_MAX ? sql`and weight_kg <= ${filters.weightMax}` : sql``;
  const weatherTempMinCondition =
    filters.weatherTempMin > WEATHER_TEMP_MIN
      ? sql`and weather_temp_c >= ${filters.weatherTempMin}`
      : sql``;
  const weatherTempMaxCondition =
    filters.weatherTempMax < WEATHER_TEMP_MAX
      ? sql`and weather_temp_c <= ${filters.weatherTempMax}`
      : sql``;
  const weatherWindMinCondition =
    filters.weatherWindMin > WEATHER_WIND_MIN
      ? sql`and weather_wind_kmh >= ${filters.weatherWindMin}`
      : sql``;
  const weatherWindMaxCondition =
    filters.weatherWindMax < WEATHER_WIND_MAX
      ? sql`and weather_wind_kmh <= ${filters.weatherWindMax}`
      : sql``;
  const weatherPressureMinCondition =
    filters.weatherPressureMin > WEATHER_PRESSURE_MIN
      ? sql`and weather_pressure_hpa >= ${filters.weatherPressureMin}`
      : sql``;
  const weatherPressureMaxCondition =
    filters.weatherPressureMax < WEATHER_PRESSURE_MAX
      ? sql`and weather_pressure_hpa <= ${filters.weatherPressureMax}`
      : sql``;
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
    select id, user_id, species, length_cm, weight_kg, lake, location, method, bait, comment, latitude, longitude, caught_at,
      weather_temp_c, weather_description, weather_wind_kmh, weather_wind_dir_deg, weather_pressure_hpa, weather_cloud_pct
    from catches
    where user_id = ${userId}
      and deleted_at is null
      ${speciesCondition}
      ${lakeCondition}
      ${baitCondition}
      ${lengthMinCondition}
      ${lengthMaxCondition}
      ${weightMinCondition}
      ${weightMaxCondition}
      ${weatherTempMinCondition}
      ${weatherTempMaxCondition}
      ${weatherWindMinCondition}
      ${weatherWindMaxCondition}
      ${weatherPressureMinCondition}
      ${weatherPressureMaxCondition}
      ${dateCondition}
      ${monthCondition}
    order by ${sql.unsafe(sortColumn)}
  `;
}

export async function getDistinctLakes(userId: number): Promise<string[]> {
  const rows = await sql<{ lake: string }[]>`
    select distinct lake from catches
    where user_id = ${userId} and deleted_at is null and lake is not null and lake <> ''
    order by lake
  `;
  return rows.map((r) => r.lake);
}

export async function getDistinctBaits(userId: number): Promise<string[]> {
  const rows = await sql<{ bait: string }[]>`
    select distinct bait from catches
    where user_id = ${userId} and deleted_at is null and bait is not null and bait <> ''
    order by bait
  `;
  return rows.map((r) => r.bait);
}

export async function getCatchById(
  userId: number,
  id: number
): Promise<Catch | null> {
  const [row] = await sql<Catch[]>`
    select id, user_id, species, length_cm, weight_kg, lake, location, method, bait, comment, latitude, longitude, caught_at,
      weather_temp_c, weather_description, weather_wind_kmh, weather_wind_dir_deg, weather_pressure_hpa, weather_cloud_pct
    from catches
    where id = ${id} and user_id = ${userId} and deleted_at is null
  `;
  return row ?? null;
}
