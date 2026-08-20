"use client";

import { useState } from "react";
import { permanentlyDeleteCatches, restoreCatches } from "@/app/actions/trash";
import type { TrashedCatch } from "@/lib/trash";

function formatDate(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

export default function TrashList({ catches }: { catches: TrashedCatch[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (catches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Papperskorgen är tom.
      </p>
    );
  }

  const allSelected = selected.size === catches.length;
  const selectedIds = Array.from(selected);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(catches.map((c) => c.id)));
    setConfirmingDelete(false);
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmingDelete(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          {allSelected ? "Avmarkera alla" : "Markera alla"}
        </button>

        <form action={restoreCatches}>
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <button
            type="submit"
            disabled={selected.size === 0}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/10"
          >
            Återställ valda
          </button>
        </form>

        {confirmingDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              Säker? Går inte att ångra.
            </span>
            <form action={permanentlyDeleteCatches}>
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <button
                type="submit"
                className="font-medium text-red-600 dark:text-red-400"
              >
                Ja, radera
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={selected.size === 0}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:border-white/15 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Radera valda permanent
          </button>
        )}
      </div>

      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
        {catches.map((item) => {
          const measurements = [
            item.length_cm != null ? `${item.length_cm} cm` : null,
            item.weight_kg != null ? `${item.weight_kg} kg` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleOne(item.id)}
                aria-label={`Markera ${item.species ?? "fångst"}`}
              />
              <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="truncate font-medium">
                  {item.species || "Okänd art"}
                </span>
                {measurements && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {measurements}
                  </span>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  Raderad {formatDate(item.deleted_at)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
