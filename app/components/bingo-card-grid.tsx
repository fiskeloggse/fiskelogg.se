import { deleteBingoCard } from "@/app/actions/bingo";
import type { BingoCard, BingoCatch } from "@/lib/bingo";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

export default function BingoCardGrid({
  card,
  catchesByCm,
}: {
  card: BingoCard;
  catchesByCm: Map<number, BingoCatch[]>;
}) {
  const cells = [];
  for (let cm = card.min_cm; cm <= card.max_cm; cm++) {
    cells.push(cm);
  }
  const doneCount = cells.filter((cm) => catchesByCm.has(cm)).length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {card.species} {card.min_cm}–{card.max_cm} cm
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
              {card.team_id ? "Team" : "Ensam"}
            </span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {doneCount} av {cells.length} rutor klara
          </p>
        </div>
        <form action={deleteBingoCard}>
          <input type="hidden" name="id" value={card.id} />
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            Ta bort
          </button>
        </form>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
        {cells.map((cm) => {
          const matches = catchesByCm.get(cm);

          if (!matches) {
            return (
              <div
                key={cm}
                className="flex aspect-square items-center justify-center rounded-lg bg-black/10 text-sm text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
              >
                {cm}
              </div>
            );
          }

          return (
            <details key={cm} className="group relative">
              <summary className="flex aspect-square cursor-pointer list-none items-center justify-center rounded-lg bg-green-600 text-sm font-medium text-white transition-colors hover:bg-green-700">
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
        })}
      </div>
    </div>
  );
}
