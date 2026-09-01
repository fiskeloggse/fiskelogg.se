"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { createBingoCard } from "@/app/actions/bingo";
import { FISH_SPECIES } from "@/lib/species";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

export default function BingoCardForm({ hasTeam }: { hasTeam: boolean }) {
  const [state, formAction, pending] = useActionState(createBingoCard, undefined);
  const [showSuccess, setShowSuccess] = useState(false);

  // Controlled so field values survive a failed submission — React resets
  // uncontrolled fields after every form action, success or not. Without
  // this, a single validation error (e.g. an unbalanced date pair) silently
  // wiped species/cm/mode too, which is how two bingo cards meant to be
  // identical could end up subtly different on a retry.
  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [species, setSpecies] = useState("");
  const [minCm, setMinCm] = useState("");
  const [maxCm, setMaxCm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (state && "success" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("solo");
      setSpecies("");
      setMinCm("");
      setMaxCm("");
      setFromDate("");
      setToDate("");
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

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
            <input
              type="radio"
              name="mode"
              value="solo"
              checked={mode === "solo"}
              onChange={() => setMode("solo")}
            />
            Ensam
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="mode"
              value="team"
              checked={mode === "team"}
              onChange={() => setMode("team")}
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
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
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
            value={minCm}
            onChange={(e) => setMinCm(e.target.value)}
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
            value={maxCm}
            onChange={(e) => setMaxCm(e.target.value)}
            required
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fromDate" className="text-sm font-medium">
            Fångster från <span className="font-normal text-zinc-400">(valfritt)</span>
          </label>
          <input
            id="fromDate"
            name="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="toDate" className="text-sm font-medium">
            Fångster till <span className="font-normal text-zinc-400">(valfritt)</span>
          </label>
          <input
            id="toDate"
            name="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        Lämna datumen tomma för att räkna alla dina registrerade fångster.
      </p>

      {state && "error" in state && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {showSuccess && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400"
        >
          Bingobricka skapad!
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
