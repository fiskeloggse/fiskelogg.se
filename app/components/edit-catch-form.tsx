"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCatch, type EditCatchState } from "@/app/actions/catches";
import { FISH_SPECIES } from "@/lib/species";
import type { Catch } from "./catch-list";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function toDatetimeLocalValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function toDatetimeLocalMax() {
  return toDatetimeLocalValue(new Date());
}

export default function EditCatchForm({
  item,
  onClose,
}: {
  item: Catch;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<EditCatchState, FormData>(
    updateCatch,
    undefined
  );

  const errorMessage = state && "error" in state ? state.error : undefined;
  const succeeded = state && "success" in state;

  const [caughtAtLocal, setCaughtAtLocal] = useState(
    toDatetimeLocalValue(item.caught_at)
  );

  useEffect(() => {
    if (succeeded) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [succeeded]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5"
    >
      <input type="hidden" name="id" value={item.id} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Redigera fångst</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`species-${item.id}`} className="text-sm font-medium">
          Art
        </label>
        <input
          id={`species-${item.id}`}
          name="species"
          type="text"
          list={`species-catalog-${item.id}`}
          defaultValue={item.species ?? ""}
          required
          autoComplete="off"
          className={inputClassName}
        />
        <datalist id={`species-catalog-${item.id}`}>
          {FISH_SPECIES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`lengthCm-${item.id}`} className="text-sm font-medium">
            Längd (cm)
          </label>
          <input
            id={`lengthCm-${item.id}`}
            name="lengthCm"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            defaultValue={item.length_cm ?? ""}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`weightKg-${item.id}`} className="text-sm font-medium">
            Vikt (kg)
          </label>
          <input
            id={`weightKg-${item.id}`}
            name="weightKg"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={item.weight_kg ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`lake-${item.id}`} className="text-sm font-medium">
            Sjö
          </label>
          <input
            id={`lake-${item.id}`}
            name="lake"
            type="text"
            defaultValue={item.lake ?? ""}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`location-${item.id}`} className="text-sm font-medium">
            Plats
          </label>
          <input
            id={`location-${item.id}`}
            name="location"
            type="text"
            defaultValue={item.location ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`bait-${item.id}`} className="text-sm font-medium">
          Bete
        </label>
        <input
          id={`bait-${item.id}`}
          name="bait"
          type="text"
          defaultValue={item.bait ?? ""}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`caughtAt-${item.id}`} className="text-sm font-medium">
          Fångstdatum och tid
        </label>
        <input
          id={`caughtAt-${item.id}`}
          type="datetime-local"
          required
          max={toDatetimeLocalMax()}
          value={caughtAtLocal}
          onChange={(e) => setCaughtAtLocal(e.target.value)}
          className={inputClassName}
        />
        <input
          type="hidden"
          name="caughtAt"
          value={caughtAtLocal ? new Date(caughtAtLocal).toISOString() : ""}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Spara"}
      </button>
    </form>
  );
}
