"use client";

import { useState } from "react";
import { deleteAllCatches } from "@/app/actions/catches";

export default function DeleteAllCatchesForm({
  catchCount,
}: {
  catchCount: number;
}) {
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);

  return (
    <form action={deleteAllCatches} className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Detta raderar alla dina {catchCount}{" "}
        {catchCount === 1 ? "loggade fångst" : "loggade fångster"} permanent.
        Det går inte att ångra.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirm1}
          onChange={(e) => setConfirm1(e.target.checked)}
        />
        Jag förstår att detta raderar alla mina fångster permanent.
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirm2}
          onChange={(e) => setConfirm2(e.target.checked)}
        />
        Jag är säker på att jag vill göra detta.
      </label>

      <button
        type="submit"
        disabled={!confirm1 || !confirm2 || catchCount === 0}
        className="self-start rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40 dark:bg-red-700 dark:hover:bg-red-600"
      >
        Radera alla fångster
      </button>
    </form>
  );
}
