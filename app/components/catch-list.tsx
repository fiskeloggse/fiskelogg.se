import { deleteCatch } from "@/app/actions/catches";

export type Catch = {
  id: number;
  user_id: number;
  species: string | null;
  length_cm: number | null;
  weight_kg: number | null;
  caught_at: Date;
  angler_name?: string;
};

function formatCaughtAt(date: Date) {
  return date.toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CatchList({
  catches,
  currentUserId,
  emptyMessage = "Inga fångster loggade än. Lägg till din första fisk!",
}: {
  catches: Catch[];
  currentUserId: number;
  emptyMessage?: string;
}) {
  if (catches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
      {catches.map((item) => {
        const measurements = [
          item.length_cm != null ? `${item.length_cm} cm` : null,
          item.weight_kg != null ? `${item.weight_kg} kg` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
              <span className="truncate font-medium">
                {item.species || "Okänd art"}
              </span>
              {item.angler_name && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {item.angler_name}
                </span>
              )}
              {measurements && (
                <span className="text-zinc-500 dark:text-zinc-400">
                  {measurements}
                </span>
              )}
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {formatCaughtAt(item.caught_at)}
              </span>
            </div>

            {item.user_id === currentUserId && (
              <form action={deleteCatch}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  aria-label="Ta bort fångst"
                  className="shrink-0 px-1 text-lg leading-none text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                >
                  ×
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
