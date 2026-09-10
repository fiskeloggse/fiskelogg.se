"use client";

import { useActionState, useEffect, useState } from "react";
import { updateBingoCard } from "@/app/actions/bingo";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default function BingoCardEditForm({
  cardId,
  currentName,
  currentFromDate,
  currentToDate,
}: {
  cardId: number;
  currentName: string | null;
  currentFromDate: Date | null;
  currentToDate: Date | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateBingoCard, undefined);

  useEffect(() => {
    if (state && "success" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(false);
    }
  }, [state]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Redigera
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/15"
    >
      <input type="hidden" name="id" value={cardId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`bingo-name-${cardId}`} className="text-sm font-medium">
          Namn på brickan
        </label>
        <input
          id={`bingo-name-${cardId}`}
          name="name"
          type="text"
          maxLength={60}
          defaultValue={currentName ?? ""}
          placeholder="Ge brickan ett eget namn (valfritt)"
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`bingo-from-${cardId}`} className="text-sm font-medium">
            Fångster från <span className="font-normal text-zinc-400">(valfritt)</span>
          </label>
          <input
            id={`bingo-from-${cardId}`}
            name="fromDate"
            type="date"
            defaultValue={toDateInputValue(currentFromDate)}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`bingo-to-${cardId}`} className="text-sm font-medium">
            Fångster till <span className="font-normal text-zinc-400">(valfritt)</span>
          </label>
          <input
            id={`bingo-to-${cardId}`}
            name="toDate"
            type="date"
            defaultValue={toDateInputValue(currentToDate)}
            className={inputClassName}
          />
        </div>
      </div>

      {state && "error" in state && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Sparar…" : "Spara"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full px-4 py-2 text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
