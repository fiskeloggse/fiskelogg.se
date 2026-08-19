"use client";

import { useState } from "react";

export default function ConfirmDeleteButton({
  action,
  id,
  compact = false,
  label = "Ta bort",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  compact?: boolean;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Säker?</span>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="font-medium text-red-600 dark:text-red-400"
          >
            Ja, ta bort
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-zinc-500 underline dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      className={
        compact
          ? "shrink-0 px-1 text-lg leading-none text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
          : "shrink-0 rounded-full px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      }
    >
      {compact ? "×" : label}
    </button>
  );
}
