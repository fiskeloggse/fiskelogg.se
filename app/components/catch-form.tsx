"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addCatch } from "@/app/actions/catches";
import { FISH_SPECIES } from "@/lib/species";
import type { SpeciesSuggestions } from "@/lib/species-suggestions";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function SpeciesChips({
  label,
  species,
  selected,
  onSelect,
}: {
  label: string;
  species: string[];
  selected: string;
  onSelect: (species: string) => void;
}) {
  if (species.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      {species.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={
            "rounded-full border px-3 py-1 text-sm transition-colors " +
            (selected === s
              ? "border-foreground bg-foreground text-background"
              : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10")
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default function CatchForm({
  suggestions,
}: {
  suggestions: SpeciesSuggestions;
}) {
  const [state, formAction, pending] = useActionState(addCatch, undefined);
  const wasPending = useRef(false);

  // Controlled so field values survive a failed submission — React resets
  // uncontrolled fields after every form action, success or not.
  const [species, setSpecies] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setSpecies("");
      setLengthCm("");
      setWeightKg("");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
    >
      <h2 className="text-lg font-semibold">Logga en fångst</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="species" className="text-sm font-medium">
          Art
        </label>

        <SpeciesChips
          label="Senaste"
          species={suggestions.recent}
          selected={species}
          onSelect={setSpecies}
        />
        <SpeciesChips
          label="Vanliga"
          species={suggestions.common}
          selected={species}
          onSelect={setSpecies}
        />

        <input
          id="species"
          name="species"
          type="text"
          list="species-catalog"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          required
          autoComplete="off"
          placeholder="Sök art eller skriv eget namn"
          className={inputClassName}
        />
        <datalist id="species-catalog">
          {FISH_SPECIES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lengthCm" className="text-sm font-medium">
            Längd (cm) <span className="font-normal text-zinc-500">(valfritt)</span>
          </label>
          <input
            id="lengthCm"
            name="lengthCm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
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
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Ange minst en av längd eller vikt. Tidpunkten sätts automatiskt till nu.
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
