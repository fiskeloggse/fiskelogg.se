export const TIMEZONE = "Europe/Stockholm";

// Plain, client-safe constants used by both server-only register-catches.ts
// (SQL) and client-side header filter components — kept here since
// register-catches.ts is marked "server-only" and can't be imported client-side.
export const LENGTH_MIN = 0;
export const LENGTH_MAX = 150;
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 20;
export const WEATHER_TEMP_MIN = -30;
export const WEATHER_TEMP_MAX = 40;
export const WEATHER_WIND_MIN = 0;
export const WEATHER_WIND_MAX = 80;
export const WEATHER_PRESSURE_MIN = 950;
export const WEATHER_PRESSURE_MAX = 1050;

export const COMPASS_DIRS = ["N", "NO", "O", "SO", "S", "SV", "V", "NV"];

export function windDirLabel(deg: number): string {
  return COMPASS_DIRS[Math.round(deg / 45) % 8];
}

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

// Each entry toggles a whole row in the log form — "weightKg"/"lake"/"bait"
// double as the representative key for their paired field (Längd, Plats,
// Fiskemetod respectively), since those rows are always shown or hidden
// together.
export const QUICK_LOG_FIELDS = [
  { key: "weightKg", label: "Längd & Vikt" },
  { key: "lake", label: "Vatten & Plats" },
  { key: "bait", label: "Fiskemetod & Bete" },
  { key: "anglerId", label: "Fiskare" },
  { key: "comment", label: "Kommentar" },
  { key: "gps", label: "GPS-position" },
] as const;

export type QuickLogFieldKey = (typeof QUICK_LOG_FIELDS)[number]["key"];

export const QUICK_LOG_FIELD_KEYS = QUICK_LOG_FIELDS.map((f) => f.key);

export const REGISTER_COLUMNS = [
  { key: "datum", label: "Datum" },
  { key: "art", label: "Art" },
  { key: "plats", label: "Plats" },
  { key: "matt", label: "cm/kg" },
  { key: "bete", label: "Fiskemetod & Bete" },
  { key: "vader", label: "Väder" },
] as const;

export type RegisterColumnKey = (typeof REGISTER_COLUMNS)[number]["key"];

export const REGISTER_COLUMN_KEYS = REGISTER_COLUMNS.map((c) => c.key);

export const GPS_MODES = [
  { value: "off", label: "Av" },
  { value: "position", label: "Spara position", hint: "Position sparas och visas på kartan." },
  {
    value: "weather",
    label: "Spara väder",
    hint: "Använder din position en gång för att hämta vädret — positionen sparas aldrig.",
  },
  {
    value: "both",
    label: "Position och väder",
    hint: "Position sparas och visas på kartan, väder hämtas också.",
  },
] as const;

export type GpsModeKey = (typeof GPS_MODES)[number]["value"];

export const GPS_MODE_KEYS = GPS_MODES.map((m) => m.value);
