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

// WMO weather codes (used by Open-Meteo) mapped to short Swedish
// descriptions and an icon. https://open-meteo.com/en/docs — "WMO Weather
// interpretation codes". Descriptions are already persisted verbatim on
// existing catches (lib/weather.ts writes them at log time) — never change
// the text of an existing entry, only add new ones, or older rows won't
// match their icon (or anything else keyed by description) any more.
export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Klart", icon: "☀️" },
  1: { description: "Mest klart", icon: "🌤️" },
  2: { description: "Växlande molnighet", icon: "⛅" },
  3: { description: "Mulet", icon: "☁️" },
  45: { description: "Dimma", icon: "🌫️" },
  48: { description: "Underkylt dimma", icon: "🌫️" },
  51: { description: "Lätt duggregn", icon: "🌦️" },
  53: { description: "Duggregn", icon: "🌦️" },
  55: { description: "Kraftigt duggregn", icon: "🌧️" },
  56: { description: "Lätt underkylt duggregn", icon: "🌧️" },
  57: { description: "Underkylt duggregn", icon: "🌧️" },
  61: { description: "Lätt regn", icon: "🌦️" },
  63: { description: "Regn", icon: "🌧️" },
  65: { description: "Kraftigt regn", icon: "🌧️" },
  66: { description: "Lätt underkylt regn", icon: "🌧️" },
  67: { description: "Underkylt regn", icon: "🌧️" },
  71: { description: "Lätt snöfall", icon: "🌨️" },
  73: { description: "Snöfall", icon: "❄️" },
  75: { description: "Kraftigt snöfall", icon: "❄️" },
  77: { description: "Snökorn", icon: "🌨️" },
  80: { description: "Lätta regnskurar", icon: "🌦️" },
  81: { description: "Regnskurar", icon: "🌧️" },
  82: { description: "Kraftiga regnskurar", icon: "⛈️" },
  85: { description: "Lätta snöbyar", icon: "🌨️" },
  86: { description: "Kraftiga snöbyar", icon: "❄️" },
  95: { description: "Åska", icon: "⛈️" },
  96: { description: "Åska med hagel", icon: "⛈️" },
  99: { description: "Kraftig åska med hagel", icon: "⛈️" },
};

export const WEATHER_DESCRIPTION_ICONS: Record<string, string> = Object.fromEntries(
  Object.values(WEATHER_CODES).map((w) => [w.description, w.icon])
);

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
  { key: "photo", label: "Foto" },
  { key: "weightKg", label: "Längd & Vikt" },
  { key: "lake", label: "Vatten & Plats" },
  { key: "bait", label: "Fiskemetod & Bete" },
  { key: "anglerId", label: "Fiskare" },
  { key: "comment", label: "Kommentar" },
  { key: "gps", label: "GPS-position" },
] as const;

export type QuickLogFieldKey = (typeof QUICK_LOG_FIELDS)[number]["key"];

export const QUICK_LOG_FIELD_KEYS = QUICK_LOG_FIELDS.map((f) => f.key);

// Which fields are pre-checked by default in the "Dela kort" panel on a
// catch's detail page. "pb" (personbästa-badge) only ever shows up there
// when the catch actually is one, regardless of this default.
export const SHARE_CARD_FIELDS = [
  { key: "species", label: "Art" },
  { key: "matt", label: "Mått" },
  { key: "vatten", label: "Vatten" },
  { key: "datum", label: "Datum" },
  { key: "vader", label: "Väder" },
  { key: "manfas", label: "Månfas" },
  { key: "pb", label: "Personbästa-badge" },
] as const;

export type ShareCardFieldKey = (typeof SHARE_CARD_FIELDS)[number]["key"];

export const SHARE_CARD_FIELD_KEYS = SHARE_CARD_FIELDS.map((f) => f.key);

export const REGISTER_COLUMNS = [
  { key: "datum", label: "Datum" },
  { key: "art", label: "Art" },
  { key: "plats", label: "Plats" },
  { key: "matt", label: "Storlek" },
  { key: "bete", label: "Fiskemetod & Bete" },
  { key: "vader", label: "Väder" },
  { key: "manfas", label: "Månfas" },
] as const;

export type RegisterColumnKey = (typeof REGISTER_COLUMNS)[number]["key"];

export const REGISTER_COLUMN_KEYS = REGISTER_COLUMNS.map((c) => c.key);

export const GPS_MODES = [
  { value: "off", label: "Av" },
  {
    value: "both",
    label: "Spara position och väder",
    hint: "Position sparas och visas på kartan, väder hämtas och sparas också.",
  },
  {
    value: "weather",
    label: "Spara väder",
    hint: "Använder din position en gång för att hämta vädret — positionen sparas aldrig.",
  },
  {
    value: "water",
    label: "Fyll i vatten och väder automatiskt",
    hint: "Använder din position en gång för att fylla i vatten och hämta väder — exakt position sparas aldrig.",
  },
] as const;

export type GpsModeKey = (typeof GPS_MODES)[number]["value"];

export const GPS_MODE_KEYS = GPS_MODES.map((m) => m.value);
