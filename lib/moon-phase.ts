// Pure date math (no API, no stored data) — works for every catch,
// including ones logged before this feature existed.
const SYNODIC_MONTH_DAYS = 29.530588861;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASES = [
  { icon: "🌑", label: "Nymåne" },
  { icon: "🌒", label: "Tilltagande månskära" },
  { icon: "🌓", label: "Första kvarteret" },
  { icon: "🌔", label: "Tilltagande måne" },
  { icon: "🌕", label: "Fullmåne" },
  { icon: "🌖", label: "Avtagande måne" },
  { icon: "🌗", label: "Sista kvarteret" },
  { icon: "🌘", label: "Avtagande månskära" },
] as const;

export function getMoonPhase(date: Date): { icon: string; label: string } {
  const daysSince = (date.getTime() - REFERENCE_NEW_MOON_MS) / 86400000;
  const fraction = ((daysSince % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const phase = fraction / SYNODIC_MONTH_DAYS; // 0 = new moon, 0.5 = full moon
  const index = Math.round(phase * 8) % 8;
  return PHASES[index];
}
