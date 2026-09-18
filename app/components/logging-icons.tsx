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

export function WaterIcon({ className }: { className?: string }) {
  return (
    <span className={className} role="img" aria-label="Vatten">
      💧
    </span>
  );
}
