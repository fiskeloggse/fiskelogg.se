"use client";

import { useActionState } from "react";
import { updateBingoCardName } from "@/app/actions/bingo";

export default function BingoCardNameForm({
  cardId,
  currentName,
}: {
  cardId: number;
  currentName: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateBingoCardName, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={cardId} />
      <label htmlFor={`bingo-name-${cardId}`} className="text-sm font-medium">
        Namn på brickan
      </label>
      <div className="flex gap-2">
        <input
          id={`bingo-name-${cardId}`}
          name="name"
          type="text"
          maxLength={60}
          defaultValue={currentName ?? ""}
          placeholder="Ge brickan ett eget namn (valfritt)"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Sparar…" : "Spara"}
        </button>
      </div>
      {state && "error" in state && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
