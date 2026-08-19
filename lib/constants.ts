export const TIMEZONE = "Europe/Stockholm";

export const STATS_WIDGETS = [
  { key: "totals", label: "Totalt" },
  { key: "species", label: "Per art" },
  { key: "monthly", label: "Fångster per månad" },
  { key: "lakes", label: "Per sjö" },
  { key: "top5", label: "Topp 5 per art" },
  { key: "leaderboard", label: "Topplista (team)" },
  { key: "streak", label: "Längsta streak" },
  { key: "bestday", label: "Bästa dagen" },
] as const;

export type StatsWidgetKey = (typeof STATS_WIDGETS)[number]["key"];

export const STATS_WIDGET_KEYS = STATS_WIDGETS.map((w) => w.key);
