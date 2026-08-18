"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addCatch } from "@/app/actions/catches";
import { FISH_SPECIES } from "@/lib/species";

const OTHER_SPECIES = "__annat__";
const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

export default function CatchForm() {
  const [state, formAction, pending] = useActionState(addCatch, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [customSpecies, setCustomSpecies] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
      setCustomSpecies(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
    >
      <h2 className="text-lg font-semibold">Logga en fångst</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="species" className="text-sm font-medium">
          Art
        </label>

        {customSpecies ? (
          <input
            id="species-other"
            name="species"
            type="text"
            autoFocus
            required
            placeholder="Skriv artnamn"
            className={inputClassName}
          />
        ) : (
          <select
            id="species"
            name="species"
            defaultValue=""
            required
            onChange={(e) => setCustomSpecies(e.target.value === OTHER_SPECIES)}
            className={inputClassName}
          >
            <option value="" disabled>
              Välj art
            </option>
            {FISH_SPECIES.map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
            <option value={OTHER_SPECIES}>Annan art…</option>
          </select>
        )}

        {customSpecies && (
          <button
            type="button"
            onClick={() => setCustomSpecies(false)}
            className="self-start text-xs text-zinc-500 underline dark:text-zinc-400"
          >
            Välj från listan istället
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lengthCm" className="text-sm font-medium">
            Längd (cm)
          </label>
          <input
            id="lengthCm"
            name="lengthCm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            required
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="weightKg" className="text-sm font-medium">
            Vikt (kg) <span className="font-normal text-zinc-500">(valfritt)</span>
          </label>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className={inputClassName}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Tidpunkten sätts automatiskt till nu.
      </p>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Loggar…" : "Logga fångst"}
      </button>
    </form>
  );
}
