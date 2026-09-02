"use client";

import { useActionState, useEffect, useState } from "react";
import { updateFiskepass, deleteFiskepass } from "@/app/actions/fiskepass";
import type { FiskepassStats as FiskepassStatsType, FiskepassWithCatchCount } from "@/lib/fiskepass";
import ConfirmDeleteButton from "./confirm-delete-button";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function toDatetimeLocalValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function formatSv(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function formatDateTime(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

function FiskepassRow({ pass }: { pass: FiskepassWithCatchCount }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateFiskepass, undefined);
  const [startLocal, setStartLocal] = useState(toDatetimeLocalValue(pass.start_time));
  const [stopLocal, setStopLocal] = useState(
    pass.stop_time ? toDatetimeLocalValue(pass.stop_time) : ""
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <li className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={pass.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Start</label>
              <input
                type="datetime-local"
                required
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className={inputClassName}
              />
              <input
                type="hidden"
                name="startTime"
                value={startLocal ? new Date(startLocal).toISOString() : ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Stopp</label>
              <input
                type="datetime-local"
                value={stopLocal}
                onChange={(e) => setStopLocal(e.target.value)}
                className={inputClassName}
              />
              <input
                type="hidden"
                name="stopTime"
                value={stopLocal ? new Date(stopLocal).toISOString() : ""}
              />
            </div>
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
              {pending ? "Sparar…" : "Spara"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/15">
      <div>
        <p className="font-medium">
          {formatDateTime(pass.start_time)}
          {pass.stop_time ? ` – ${formatDateTime(pass.stop_time)}` : " – pågår"}
        </p>
        <p className="text-zinc-500 dark:text-zinc-400">
          {pass.target_species && pass.target_species.length > 0
            ? pass.target_species.join(", ") + " · "
            : ""}
          {pass.catch_count} {pass.catch_count === 1 ? "fångst" : "fångster"}
          {pass.catch_count === 0 && pass.stop_time && " · Bompass"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
        >
          Redigera
        </button>
        <ConfirmDeleteButton action={deleteFiskepass} id={pass.id} compact />
      </div>
    </li>
  );
}

export default function FiskepassStats({
  stats,
  history,
}: {
  stats: FiskepassStatsType;
  history: FiskepassWithCatchCount[];
}) {
  return (
    <details className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <summary className="cursor-pointer text-lg font-semibold">Fiskepass</summary>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-2xl font-semibold">{formatSv(stats.totalHours)}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Fiskade timmar</p>
        </div>
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-2xl font-semibold">{stats.antalPass}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Antal pass</p>
        </div>
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <p className="text-2xl font-semibold">{stats.antalBompass}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Antal bompass</p>
        </div>
      </div>

      {history.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {history.map((pass) => (
            <FiskepassRow key={pass.id} pass={pass} />
          ))}
        </ul>
      )}
    </details>
  );
}
