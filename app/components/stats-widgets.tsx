import type {
  StatsBestDay,
  StatsLakeRow,
  StatsLeaderboardRow,
  StatsMonthRow,
  StatsSpeciesRow,
  StatsTop5SpeciesRow,
  StatsTotals,
} from "@/lib/stats";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
  );
}

export function TotalsWidget({ totals }: { totals: StatsTotals }) {
  const stats = [
    { label: "Fångster", value: totals.catches },
    { label: "Arter", value: totals.species },
    { label: "Total längd", value: `${roundTo2(totals.totalLengthCm)} cm` },
    { label: "Total vikt", value: `${roundTo2(totals.totalWeightKg)} kg` },
  ];

  return (
    <Card title="Totalt">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SpeciesWidget({ rows }: { rows: StatsSpeciesRow[] }) {
  return (
    <Card title="Per art">
      {rows.length === 0 ? (
        <Empty>Inga fångster loggade än.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                <th className="py-1.5 pr-2 font-medium">Art</th>
                <th className="py-1.5 pr-2 text-right font-medium">Antal</th>
                <th className="py-1.5 pr-2 text-right font-medium">
                  Snittlängd
                </th>
                <th className="py-1.5 pr-2 text-right font-medium">
                  Snittvikt
                </th>
                <th className="py-1.5 text-right font-medium">Störst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {rows.map((r) => (
                <tr key={r.species}>
                  <td className="py-1.5 pr-2">{r.species}</td>
                  <td className="py-1.5 pr-2 text-right">{r.count}</td>
                  <td className="py-1.5 pr-2 text-right">
                    {r.avgLengthCm != null ? `${r.avgLengthCm} cm` : "–"}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    {r.avgWeightKg != null ? `${r.avgWeightKg} kg` : "–"}
                  </td>
                  <td className="py-1.5 text-right">
                    {r.maxLengthCm != null ? `${r.maxLengthCm} cm` : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function MonthlyWidget({ rows }: { rows: StatsMonthRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <Card title="Fångster per månad">
      {total === 0 ? (
        <Empty>Inga fångster loggade i år än.</Empty>
      ) : (
        <div className="flex h-32 items-end gap-1.5 sm:gap-2">
          {rows.map((r) => (
            <div
              key={r.month}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex h-24 w-full items-end">
                <div
                  className="w-full rounded-t bg-foreground/70"
                  style={{ height: `${(r.count / max) * 100}%` }}
                  title={`${r.count} st`}
                />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {MONTH_LABELS[r.month - 1]}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LakesWidget({ rows }: { rows: StatsLakeRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card title="Per sjö">
      {rows.length === 0 ? (
        <Empty>Ingen sjö har fyllts i på några fångster än.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.lake} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate sm:w-32">{r.lake}</span>
              <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-foreground/70"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Top5Widget({
  rows,
  hasTeam,
}: {
  rows: StatsTop5SpeciesRow[];
  hasTeam: boolean;
}) {
  return (
    <Card title="Topp 5 per art">
      {rows.length === 0 ? (
        <Empty>Inga fångster med längd loggade än.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.species}>
              <p className="text-sm font-medium">{r.species}</p>
              <ol className="mt-1 flex flex-col gap-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {r.catches.map((c, i) => (
                  <li key={i}>
                    <span className="text-foreground">{c.lengthCm} cm</span>
                    {" · "}
                    {formatDate(c.caughtAt)}
                    {hasTeam && ` · ${c.anglerName}`}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LeaderboardWidget({
  rows,
  hasTeam,
}: {
  rows: StatsLeaderboardRow[];
  hasTeam: boolean;
}) {
  return (
    <Card title="Topplista (team)">
      {!hasTeam ? (
        <Empty>Du behöver ett team för att se en topplista.</Empty>
      ) : rows.length === 0 || rows.every((r) => r.count === 0) ? (
        <Empty>Inga fångster loggade i teamet än.</Empty>
      ) : (
        <ol className="flex flex-col gap-2 text-sm">
          {rows.map((r, i) => (
            <li key={r.userId} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-zinc-400 dark:text-zinc-500">
                {i + 1}
              </span>
              <span className="flex-1">{r.name}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {r.count} fångster · {r.speciesCount} arter
                {r.maxLengthCm != null && ` · störst ${r.maxLengthCm} cm`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function StreakWidget({ days }: { days: number }) {
  return (
    <Card title="Längsta streak">
      {days === 0 ? (
        <Empty>Inga fångster loggade än.</Empty>
      ) : (
        <p className="text-2xl font-semibold">
          {days} {days === 1 ? "dag" : "dagar"} i rad
        </p>
      )}
    </Card>
  );
}

export function BestDayWidget({ day }: { day: StatsBestDay }) {
  return (
    <Card title="Bästa dagen">
      {!day ? (
        <Empty>Inga fångster loggade än.</Empty>
      ) : (
        <p className="text-2xl font-semibold">
          {day.count} {day.count === 1 ? "fångst" : "fångster"}
          <span className="ml-2 text-base font-normal text-zinc-500 dark:text-zinc-400">
            {formatDate(day.date)}
          </span>
        </p>
      )}
    </Card>
  );
}
