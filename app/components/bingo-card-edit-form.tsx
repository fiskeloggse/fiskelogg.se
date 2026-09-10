"use client";

import { useActionState, useEffect } from "react";
import { updateBingoCard } from "@/app/actions/bingo";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

// Controlled from BingoCardGrid -- the trigger button lives top-right in
// the card's summary, but the fields themselves render down in the
// expanded content, so open/close state has to live one level up.
export default function BingoCardEditForm({
  cardId,
  currentName,
  currentFromDate,
  currentToDate,
  onDone,
}: {
  cardId: number;
  currentName: string | null;
  currentFromDate: Date | null;
  currentToDate: Date | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateBingoCard, undefined);

  useEffect(() => {
    if (state && "success" in state) onDone();
  }, [state, onDone]);

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
          onClick={onDone}
          className="rounded-full px-4 py-2 text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
