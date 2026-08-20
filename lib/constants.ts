export const TIMEZONE = "Europe/Stockholm";

// Plain, client-safe constants used by both server-only register-catches.ts
// (SQL) and client-side header filter components — kept here since
// register-catches.ts is marked "server-only" and can't be imported client-side.
export const LENGTH_MIN = 0;
export const LENGTH_MAX = 150;
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 20;

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

export const QUICK_LOG_FIELDS = [
  { key: "weightKg", label: "Vikt" },
  { key: "lake", label: "Sjö" },
  { key: "location", label: "Plats" },
  { key: "bait", label: "Bete" },
  { key: "anglerId", label: "Fiskare" },
] as const;

export type QuickLogFieldKey = (typeof QUICK_LOG_FIELDS)[number]["key"];

export const QUICK_LOG_FIELD_KEYS = QUICK_LOG_FIELDS.map((f) => f.key);

export const REGISTER_COLUMNS = [
  { key: "datum", label: "Datum" },
  { key: "art", label: "Art" },
  { key: "plats", label: "Plats" },
  { key: "matt", label: "cm/kg" },
  { key: "bete", label: "Bete" },
] as const;

export type RegisterColumnKey = (typeof REGISTER_COLUMNS)[number]["key"];

export const REGISTER_COLUMN_KEYS = REGISTER_COLUMNS.map((c) => c.key);
