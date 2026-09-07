"use client";

import { useRef, useState } from "react";
import { permanentlyDeleteFiskepass, restoreFiskepass } from "@/app/actions/fiskepass";
import type { TrashedFiskepass } from "@/lib/fiskepass";
import ConfirmDialog from "./confirm-dialog";

function formatDateTime(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

export default function FiskepassTrashList({
  passes,
}: {
  passes: TrashedFiskepass[];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const permanentDeleteFormRef = useRef<HTMLFormElement>(null);

  if (passes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Papperskorgen är tom.
      </p>
    );
  }

  const allSelected = selected.size === passes.length;
  const selectedIds = Array.from(selected);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(passes.map((p) => p.id)));
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

        <form action={restoreFiskepass}>
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

        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          disabled={selected.size === 0}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:border-white/15 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Radera valda permanent
        </button>

        <form ref={permanentDeleteFormRef} action={permanentlyDeleteFiskepass} className="hidden">
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
        </form>

        <ConfirmDialog
          open={confirmingDelete}
          title={`Radera ${selectedIds.length} pass permanent?`}
          description="Går inte att ångra. Fångsterna i passet påverkas inte."
          confirmLabel="Ja, radera permanent"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            permanentDeleteFormRef.current?.requestSubmit();
          }}
        />
      </div>

      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
        {passes.map((pass) => (
          <li key={pass.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(pass.id)}
              onChange={() => toggleOne(pass.id)}
              aria-label={`Markera pass ${formatDateTime(pass.start_time)}`}
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="truncate font-medium">
                {formatDateTime(pass.start_time)}
                {pass.stop_time ? ` – ${formatDateTime(pass.stop_time)}` : " – pågick"}
              </span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                {pass.team_id ? "Team" : "Ensam"}
              </span>
              {pass.target_species && pass.target_species.length > 0 && (
                <span className="text-zinc-500 dark:text-zinc-400">
                  {pass.target_species.join(", ")}
                </span>
              )}
              <span className="text-zinc-500 dark:text-zinc-400">
                {pass.catch_count} {pass.catch_count === 1 ? "fångst" : "fångster"}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Raderad {formatDateTime(pass.deleted_at)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
