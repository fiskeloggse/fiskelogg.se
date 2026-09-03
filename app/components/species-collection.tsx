"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toggleHiddenSpecies } from "@/app/actions/preferences";
import type { PersonalBest } from "@/lib/personal-bests";
import {
  getStorfiskPercent,
  getStorfiskStatus,
  STORFISKREGISTRET_SPECIES,
} from "@/lib/storfisk";

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

export default function SpeciesCollection({
  speciesBreakdown,
  personalBests,
  hiddenSpecies,
}: {
  speciesBreakdown: { species: string; count: number }[];
  personalBests: PersonalBest[];
  hiddenSpecies: string[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState(() => new Set(hiddenSpecies));
  const [editMode, setEditMode] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const countBySpecies = new Map(speciesBreakdown.map((s) => [s.species, s.count]));
  const pbBySpecies = new Map(personalBests.map((pb) => [pb.species, pb]));

  const selectedIsCaught = selected ? countBySpecies.has(selected) : false;
  const selectedPb = selected ? pbBySpecies.get(selected) : undefined;
  const selectedStatus = selected ? getStorfiskStatus(selected) : null;
  const selectedPercent =
    selected && selectedPb?.heaviest
      ? getStorfiskPercent(selected, selectedPb.heaviest.weight_kg)
      : null;

  // Optimistic toggle -- updates the grid immediately, then fires the save
  // in the background rather than waiting on a round trip for every click.
  function toggleHidden(species: string, hide: boolean) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (hide) next.add(species);
      else next.delete(species);
      return next;
    });
    const formData = new FormData();
    formData.set("species", species);
    formData.set("hide", hide ? "on" : "off");
    void toggleHiddenSpecies(formData);
  }

  const displayedSpecies = editMode
    ? STORFISKREGISTRET_SPECIES
    : STORFISKREGISTRET_SPECIES.filter((species) => !hidden.has(species));

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {hidden.size > 0
            ? `${hidden.size} art${hidden.size === 1 ? "" : "er"} dold${hidden.size === 1 ? "" : "a"}`
            : editMode
              ? "Bocka ur arter du inte vill se i Artjakten"
              : ""}
        </p>
        <button
          type="button"
          onClick={() => setEditMode((e) => !e)}
          className="shrink-0 text-sm text-zinc-500 underline underline-offset-2 hover:text-foreground dark:text-zinc-400"
        >
          {editMode ? "Klar" : "Redigera"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {displayedSpecies.map((species) => {
          const isCaught = countBySpecies.has(species);
          const pb = pbBySpecies.get(species);
          const isStorfisk =
            pb?.heaviest != null &&
            (getStorfiskPercent(species, pb.heaviest.weight_kg) ?? 0) >= 100;
          const isHidden = hidden.has(species);

          if (editMode) {
            return (
              <label
                key={species}
                className={
                  "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors " +
                  (isHidden
                    ? "border-dashed border-black/10 text-zinc-400 dark:border-white/10 dark:text-zinc-600"
                    : isCaught
                      ? "border-foreground/30 bg-foreground/5 font-medium"
                      : "border-dashed border-black/10 text-zinc-500 dark:border-white/10 dark:text-zinc-400")
                }
              >
                <input
                  type="checkbox"
                  checked={!isHidden}
                  onChange={(e) => toggleHidden(species, !e.target.checked)}
                  className="shrink-0"
                />
                <span className={isHidden ? "line-through" : ""}>{species}</span>
              </label>
            );
          }

          if (!isCaught) {
            return (
              <button
                key={species}
                type="button"
                onClick={() => setSelected(species)}
                className="rounded-lg border border-dashed border-black/10 px-2.5 py-1.5 text-left text-sm text-zinc-400 transition-colors hover:border-black/20 dark:border-white/10 dark:text-zinc-600 dark:hover:border-white/20"
              >
                {species}
              </button>
            );
          }
          return (
            <button
              key={species}
              type="button"
              onClick={() => setSelected(species)}
              className="rounded-lg border border-foreground/30 bg-foreground/5 px-2.5 py-1.5 text-left text-sm font-medium transition-colors hover:bg-foreground/10"
            >
              {species}
              {isStorfisk && (
                <span className="ml-1" title="Storfisk">
                  🏅
                </span>
              )}
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setSelected(null);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setSelected(null);
        }}
        className="m-auto rounded-xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/15 dark:bg-zinc-900"
      >
        {selected && (
          <div className="flex w-[min(90vw,20rem)] flex-col gap-2 p-5">
            <p className="font-semibold">{selected}</p>

            {selectedIsCaught && (
              <p className="text-sm">
                Antal fångade: {countBySpecies.get(selected)}
              </p>
            )}
            {selectedPb?.heaviest && (
              <p className="text-sm">
                Mitt PB (vikt):{" "}
                <Link
                  href={`/register/${selectedPb.heaviest.id}`}
                  className="underline"
                >
                  {formatSv(selectedPb.heaviest.weight_kg)} kg
                </Link>
              </p>
            )}
            {selectedPb?.longest && (
              <p className="text-sm">
                Mitt PB (längd):{" "}
                <Link
                  href={`/register/${selectedPb.longest.id}`}
                  className="underline"
                >
                  {selectedPb.longest.length_cm} cm
                </Link>
              </p>
            )}
            {selectedStatus?.kind === "weight" && (
              <p className="text-sm">
                Sportfiskarnas minimivikt: {formatSv(selectedStatus.minWeightKg)} kg
              </p>
            )}
            {selectedStatus?.kind === "length" && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Mäts i längd hos Sportfiskarna (ingen minimilängd angiven).
              </p>
            )}
            {selectedPercent != null && (
              <p className="text-sm font-medium">
                {Math.round(selectedPercent)}% av minimivikten
              </p>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-2 self-end text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Stäng
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
