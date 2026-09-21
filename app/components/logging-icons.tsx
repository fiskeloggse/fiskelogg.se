// Shared between the per-catch logging toggles (catch-form.tsx) and the
// account-level GPS mode picker (Konto → Loggning), so the same three
// glyphs visually tie a Konto choice to what it turns on when logging.
export function PositionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <title>Position</title>
      <path d="M12 21s-7-6.05-7-11a7 7 0 0 1 14 0c0 4.95-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

export function WeatherIcon({ className }: { className?: string }) {
  return (
    <span className={className} role="img" aria-label="Väder">
      🌤️
    </span>
  );
}

// A wave glyph rather than a droplet -- a droplet reads as rain/precipitation
// (already covered by the weather icon), not "body of water".
export function WaterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <title>Vatten</title>
      <path d="M2 9c1.4-1.3 2.8-1.3 4.2 0s2.8 1.3 4.2 0 2.8-1.3 4.2 0 2.8 1.3 4.2 0 2.8-1.3 4.2 0" />
      <path d="M2 15c1.4-1.3 2.8-1.3 4.2 0s2.8 1.3 4.2 0 2.8-1.3 4.2 0 2.8 1.3 4.2 0 2.8-1.3 4.2 0" />
    </svg>
  );
}

const iconClassName = "h-4 w-4 text-zinc-500 dark:text-zinc-400";

// Shared between Konto → Loggning and the first-login onboarding guide, so
// both pickers offer the exact same three logging choices with matching
// icons and copy.
export const LOGGING_OPTIONS = [
  {
    key: "log_position",
    label: "Position",
    hint: "Sparar exakt position och visar fångsten på kartan.",
    icon: <PositionIcon className={iconClassName} />,
  },
  {
    key: "log_weather",
    label: "Väder",
    hint: "Hämtar och sparar väder vid loggningen.",
    icon: <WeatherIcon className="text-base" />,
  },
  {
    key: "fill_water",
    label: "Vatten",
    hint: "Fyller i vattnets namn automatiskt utifrån din position.",
    icon: <WaterIcon className={iconClassName} />,
  },
] as const;
