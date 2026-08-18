"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  const [open, setOpen] = useState(false);
  const [bingoNotice, setBingoNotice] = useState<{
    species: string;
    cm: number;
  } | null>(null);

  // Controlled so field values survive a failed submission — React resets
  // uncontrolled fields after every form action, success or not.
  const [species, setSpecies] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const errorMessage = state && "error" in state ? state.error : undefined;

  useEffect(() => {
    if (wasPending.current && !pending && !errorMessage) {
      setSpecies("");
      setLengthCm("");
      setWeightKg("");
      if (state && "bingoMatch" in state) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBingoNotice(state.bingoMatch);
      }
    }
    wasPending.current = pending;
  }, [pending, state, errorMessage]);

  useEffect(() => {
    if (!bingoNotice) return;
    const timer = setTimeout(() => setBingoNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [bingoNotice]);

  return (
    <>
      {bingoNotice && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/15 dark:bg-zinc-900">
          <p className="text-sm">
            🎯 Bingo! {bingoNotice.cm} cm {bingoNotice.species} bockade av en
            ruta.{" "}
            <Link href="/bingo" className="underline">
              Visa bingobricka
            </Link>
          </p>
          <button
            type="button"
            onClick={() => setBingoNotice(null)}
            aria-label="Stäng"
            className="text-zinc-500 hover:text-foreground dark:text-zinc-400"
          >
            ×
          </button>
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Logga fångst
        </button>
      ) : (
        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Logga en fångst</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>

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
                Längd (cm){" "}
                <span className="font-normal text-zinc-500">(valfritt)</span>
              </label>
              <input
                id="lengthCm"
                name="lengthCm"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="weightKg" className="text-sm font-medium">
                Vikt (kg){" "}
                <span className="font-normal text-zinc-500">(valfritt)</span>
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
            Ange minst en av längd eller vikt. Tidpunkten sätts automatiskt
            till nu.
          </p>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
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
      )}
    </>
  );
}
