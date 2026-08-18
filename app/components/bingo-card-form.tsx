"use client";

import { useActionState } from "react";
import { createBingoCard } from "@/app/actions/bingo";
import { FISH_SPECIES } from "@/lib/species";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

export default function BingoCardForm({ hasTeam }: { hasTeam: boolean }) {
  const [state, formAction, pending] = useActionState(createBingoCard, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
    >
      <h2 className="text-lg font-semibold">Ny bingobricka</h2>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">Bricka för</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode" value="solo" defaultChecked />
            Ensam
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="mode"
              value="team"
              disabled={!hasTeam}
            />
            Team{!hasTeam && " (kräver team)"}
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bingo-species" className="text-sm font-medium">
            Art
          </label>
          <select
            id="bingo-species"
            name="species"
            defaultValue=""
            required
            className={inputClassName}
          >
            <option value="" disabled>
              Välj art
            </option>
            {FISH_SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="minCm" className="text-sm font-medium">
            Från (cm)
          </label>
          <input
            id="minCm"
            name="minCm"
            type="number"
            step="1"
            min="0"
            required
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxCm" className="text-sm font-medium">
            Till (cm)
          </label>
          <input
            id="maxCm"
            name="maxCm"
            type="number"
            step="1"
            min="0"
            required
            className={inputClassName}
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Skapar…" : "Skapa bricka"}
      </button>
    </form>
  );
}
