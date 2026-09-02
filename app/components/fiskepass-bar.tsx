"use client";

import { useActionState, useEffect, useState } from "react";
import { startFiskepass, stopFiskepass } from "@/app/actions/fiskepass";
import { FISH_SPECIES } from "@/lib/species";
import TextSuggestInput from "./text-suggest-input";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function formatElapsed(startTime: Date, now: Date): string {
  const totalMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

function StartFiskepass() {
  const [state, formAction, pending] = useActionState(startFiskepass, undefined);
  const [open, setOpen] = useState(false);
  const [speciesInput, setSpeciesInput] = useState("");
  const [targetSpecies, setTargetSpecies] = useState<string[]>([]);

  function addSpecies() {
    const trimmed = speciesInput.trim();
    if (trimmed && !targetSpecies.includes(trimmed)) {
      setTargetSpecies((prev) => [...prev, trimmed]);
    }
    setSpeciesInput("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        🎣 Starta fiskepass
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5"
    >
      <p className="text-sm font-medium">Starta fiskepass</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="fiskepass-species" className="text-sm font-medium">
          Målart (valfritt)
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <TextSuggestInput
              id="fiskepass-species"
              name="speciesSearch"
              value={speciesInput}
              onChange={setSpeciesInput}
              options={FISH_SPECIES}
              placeholder="Sök art"
              className={inputClassName}
            />
          </div>
          <button
            type="button"
            onClick={addSpecies}
            disabled={!speciesInput.trim()}
            className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/15 dark:hover:bg-white/10"
          >
            Lägg till
          </button>
        </div>
        {targetSpecies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {targetSpecies.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-sm dark:border-white/15 dark:bg-white/10"
              >
                {s}
                <button
                  type="button"
                  onClick={() =>
                    setTargetSpecies((prev) => prev.filter((x) => x !== s))
                  }
                  aria-label={`Ta bort ${s}`}
                  className="text-zinc-500 hover:text-foreground dark:text-zinc-400"
                >
                  ×
                </button>
                <input type="hidden" name="targetSpecies" value={s} />
              </span>
            ))}
          </div>
        )}
      </div>

      {state && "error" in state && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Startar…" : "Starta pass"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}

function OpenFiskepass({
  id,
  targetSpecies,
  startTime,
}: {
  id: number;
  targetSpecies: string[] | null;
  startTime: Date;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5">
      <div>
        <p className="text-sm font-medium">
          🎣 Fiskepass pågår · {formatElapsed(startTime, now)}
        </p>
        {targetSpecies && targetSpecies.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-1.5">
            {targetSpecies.map((s) => (
              <span
                key={s}
                className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs dark:border-white/15"
              >
                {s}
              </span>
            ))}
          </p>
        )}
      </div>
      <form action={stopFiskepass}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Avsluta pass
        </button>
      </form>
    </div>
  );
}

export default function FiskepassBar({
  openPass,
}: {
  openPass: { id: number; target_species: string[] | null; start_time: Date } | null;
}) {
  if (openPass) {
    return (
      <OpenFiskepass
        id={openPass.id}
        targetSpecies={openPass.target_species}
        startTime={openPass.start_time}
      />
    );
  }
  return <StartFiskepass />;
}
