export const TIMEZONE = "Europe/Stockholm";

export const QUICK_LOG_FIELDS = [
  { key: "weightKg", label: "Vikt" },
  { key: "lake", label: "Sjö" },
  { key: "location", label: "Plats" },
  { key: "bait", label: "Bete" },
  { key: "anglerId", label: "Fiskare" },
] as const;

export type QuickLogFieldKey = (typeof QUICK_LOG_FIELDS)[number]["key"];

export const QUICK_LOG_FIELD_KEYS = QUICK_LOG_FIELDS.map((f) => f.key);
