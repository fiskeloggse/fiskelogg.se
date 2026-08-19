import { deleteBingoCard } from "@/app/actions/bingo";
import type { BingoCard, BingoCatch } from "@/lib/bingo";
import ConfirmDeleteButton from "./confirm-delete-button";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/10 text-xs text-zinc-500 sm:h-12 sm:w-12 sm:text-sm dark:bg-white/10 dark:text-zinc-400">
        {cm}
      </div>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex h-9 w-9 shrink-0 cursor-pointer list-none items-center justify-center rounded-lg bg-green-600 text-xs font-medium text-white transition-colors hover:bg-green-700 sm:h-12 sm:w-12 sm:text-sm">
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

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {card.species} {card.min_cm}–{card.max_cm} cm
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
              {card.team_id ? "Team" : "Ensam"}
            </span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {doneCount} av {totalCount} rutor klara
          </p>
        </div>
        <ConfirmDeleteButton
          action={deleteBingoCard}
          id={card.id}
          label="Ta bort bingobricka"
        />
      </div>

      <p className="text-xs text-zinc-400 sm:hidden dark:text-zinc-500">
        ← Bläddra sidledes för fler rutor →
      </p>

      <div className="flex flex-col gap-2 overflow-x-auto">
        {decadeRows.map(([decade, cms]) => (
          <div key={decade} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {decade}–{decade + 9}
            </span>
            <div className="flex gap-1.5">
              {cms.map((cm) => (
                <BingoCell key={cm} cm={cm} matches={catchesByCm.get(cm)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
