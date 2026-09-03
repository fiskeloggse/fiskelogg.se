"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { startFiskepass, stopFiskepass } from "@/app/actions/fiskepass";
import { FISH_SPECIES } from "@/lib/species";
import ConfirmDialog from "./confirm-dialog";
import TextSuggestInput from "./text-suggest-input";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

type OpenFiskepass = {
  id: number;
  target_species: string[] | null;
  start_time: Date;
};

function formatElapsed(startTime: Date, now: Date): string {
  const totalMinutes = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function StartFiskepassButton() {
  const [state, formAction, pending] = useActionState(startFiskepass, undefined);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [speciesInput, setSpeciesInput] = useState("");
  const [targetSpecies, setTargetSpecies] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state && "success" in state) setOpen(false);
  }, [state]);

  function addSpecies(species: string) {
    const trimmed = species.trim();
    if (trimmed && !targetSpecies.includes(trimmed)) {
      setTargetSpecies((prev) => [...prev, trimmed]);
    }
    setSpeciesInput("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Starta fiskepass
      </button>

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[min(90vw,28rem)] rounded-xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/15 dark:bg-zinc-900"
      >
        <form action={formAction} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Starta fiskepass</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>

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
                  onSelect={addSpecies}
                  options={FISH_SPECIES}
                  placeholder="Sök art"
                  className={inputClassName}
                />
              </div>
              <button
                type="button"
                onClick={() => addSpecies(speciesInput)}
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

          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? "Startar…" : "Starta pass"}
          </button>
        </form>
      </dialog>
    </>
  );
}

function StopFiskepassButton({ id, startTime }: { id: number; startTime: Date }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = formatElapsed(startTime, now);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Avsluta pass <span className="text-zinc-500 dark:text-zinc-400">· {elapsed}</span>
      </button>

      <form ref={formRef} action={stopFiskepass} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>

      <ConfirmDialog
        open={open}
        title="Avsluta fiskepasset?"
        description={`Passet har pågått i ${elapsed}.`}
        confirmLabel="Avsluta pass"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}

// The button lives in the same row as "+ Logga fisk" / "+ Logga tidigare
// fisk" (passed into CatchForm as a slot) so starting or stopping a session
// reads as one of the app's logging actions, not a separate feature.
export default function FiskepassButton({ openPass }: { openPass: OpenFiskepass | null }) {
  if (openPass) return <StopFiskepassButton id={openPass.id} startTime={openPass.start_time} />;
  return <StartFiskepassButton />;
}

// Status line shown above the log form while a pass is open. A blinking
// "recording" dot carries the "still going" signal at a glance -- elapsed
// time lives on the stop button instead, since that's a live-updating
// number that matters most right where you'd end the pass.
export function FiskepassStatus({ openPass }: { openPass: OpenFiskepass | null }) {
  if (!openPass) return null;

  return (
    <p className="flex items-center justify-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
      </span>
      Fiskepass pågår sedan {formatClockTime(openPass.start_time)}
      {openPass.target_species && openPass.target_species.length > 0
        ? ` · ${openPass.target_species.join(", ")}`
        : ""}
    </p>
  );
}
