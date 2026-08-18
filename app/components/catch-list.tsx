import { deleteCatch } from "@/app/actions/catches";

export type Catch = {
  id: number;
  species: string | null;
  length_cm: number;
  weight_kg: number | null;
  caught_at: Date;
};

function formatCaughtAt(date: Date) {
  return date.toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CatchList({ catches }: { catches: Catch[] }) {
  if (catches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Inga fångster loggade än. Lägg till din första fisk!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {catches.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5"
        >
          <div>
            <p className="font-medium">{item.species || "Okänd art"}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {item.length_cm} cm
              {item.weight_kg != null ? ` · ${item.weight_kg} kg` : ""}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {formatCaughtAt(item.caught_at)}
            </p>
          </div>

          <form action={deleteCatch}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              aria-label="Ta bort fångst"
              className="rounded-full px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              Ta bort
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
