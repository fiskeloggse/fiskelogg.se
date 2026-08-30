import { deleteBingoCard } from "@/app/actions/bingo";
import type { BingoCard, BingoCatch } from "@/lib/bingo";
import ConfirmDeleteButton from "./confirm-delete-button";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

// Days remaining until (and including) to_date, or a finished label once
// it's passed. Compares by calendar date, not exact time, since to_date
// has no time component of its own.
function dateStatus(toDate: Date | null): string | null {
  if (!toDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);
  const diffDays = Math.round((to.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return "Avslutad";
  if (diffDays === 0) return "Sista dagen";
  return `${diffDays} ${diffDays === 1 ? "dag" : "dagar"} kvar`;
}

// Groups cm values by decade (70-79, 80-89, ...) so each decade renders as
// its own row, in cm order.
function groupByDecade(min: number, max: number): [number, number[]][] {
  const groups = new Map<number, number[]>();
  for (let cm = min; cm <= max; cm++) {
    const decade = Math.floor(cm / 10) * 10;
    const list = groups.get(decade);
    if (list) {
      list.push(cm);
    } else {
      groups.set(decade, [cm]);
    }
  }
  return Array.from(groups.entries());
}

function BingoCell({ cm, matches }: { cm: number; matches: BingoCatch[] | undefined }) {
  if (!matches) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-black/10 text-xs text-zinc-500 sm:h-12 sm:w-12 sm:text-sm dark:bg-white/10 dark:text-zinc-400">
        {cm}
      </div>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex h-8 w-8 shrink-0 cursor-pointer list-none items-center justify-center rounded-sm bg-green-600 text-xs font-medium text-white transition-colors hover:bg-green-700 sm:h-12 sm:w-12 sm:text-sm">
        {cm}
      </summary>
      <div className="absolute z-10 mt-1 w-56 rounded-lg border border-black/10 bg-white p-3 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-900">
        <ul className="flex flex-col gap-2">
          {matches.map((c) => (
            <li key={c.id}>
              <p className="font-medium">{c.angler_name}</p>
              <p className="text-zinc-500 dark:text-zinc-400">
                {c.length_cm} cm
                {c.weight_kg != null ? ` · ${c.weight_kg} kg` : ""} ·{" "}
                {formatDate(c.caught_at)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export default function BingoCardGrid({
  card,
  catchesByCm,
}: {
  card: BingoCard;
  catchesByCm: Map<number, BingoCatch[]>;
}) {
  const decadeRows = groupByDecade(card.min_cm, card.max_cm);
  const totalCount = decadeRows.reduce((sum, [, cms]) => sum + cms.length, 0);
  const doneCount = decadeRows.reduce(
    (sum, [, cms]) => sum + cms.filter((cm) => catchesByCm.has(cm)).length,
    0
  );
  const remainingCount = totalCount - doneCount;
  const status = dateStatus(card.to_date);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-3 sm:p-5 dark:border-white/15 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {card.species} {card.min_cm}–{card.max_cm} cm
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
              {card.team_id ? "Team" : "Ensam"}
            </span>
            {status && (
              <span
                className={
                  "ml-2 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-normal " +
                  (status === "Avslutad"
                    ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")
                }
              >
                {status}
              </span>
            )}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {remainingCount === 0
              ? "Alla rutor klara!"
              : `${remainingCount} ${remainingCount === 1 ? "ruta" : "rutor"} kvar`}{" "}
            ({doneCount} av {totalCount} klara)
            {card.from_date && card.to_date && (
              <> · {formatDate(card.from_date)}–{formatDate(card.to_date)}</>
            )}
          </p>
        </div>
        <ConfirmDeleteButton
          action={deleteBingoCard}
          id={card.id}
          label="Ta bort bingobricka"
        />
      </div>

      {/* One column per decade, values running top to bottom within it
          (70–79 in column 1, 80–89 in column 2, ...). Each cell is placed
          explicitly by its own ones-digit (row) and decade index (column)
          instead of relying on source order, so a range that doesn't start
          on a round decade (e.g. 72–115) still lines up — 72 lands in the
          "2" row under its decade instead of shifting the whole column up.
          self-start keeps the grid sized to its own content — without it,
          the flex-col parent's default cross-axis stretch would make the
          grid (and so its auto columns) fill the card's full width,
          leaving each column much wider than its 32px cells. */}
      <div
        className="inline-grid self-start gap-px"
        style={{
          gridTemplateColumns: `repeat(${decadeRows.length}, auto)`,
        }}
      >
        {decadeRows.flatMap(([, cms], colIndex) =>
          cms.map((cm) => (
            <div
              key={cm}
              style={{ gridColumn: colIndex + 1, gridRow: (cm % 10) + 1 }}
            >
              <BingoCell cm={cm} matches={catchesByCm.get(cm)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
