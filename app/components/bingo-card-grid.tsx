"use client";

import { useState } from "react";
import Link from "next/link";
import { archiveBingoCard, deleteBingoCard, unarchiveBingoCard } from "@/app/actions/bingo";
import type { BingoCard, BingoCatch } from "@/lib/bingo";
import BingoCardEditForm from "./bingo-card-edit-form";
import ConfirmDeleteButton from "./confirm-delete-button";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

// A full calendar year (1 jan–31 dec, same year) reads as just the year --
// "2026" instead of "1 jan. 2026–31 dec. 2026" -- since that's exactly how
// these cards are normally set up for the yearly bingo season.
function formatDateRange(from: Date, to: Date): string {
  const isFullYear =
    from.getUTCMonth() === 0 &&
    from.getUTCDate() === 1 &&
    to.getUTCMonth() === 11 &&
    to.getUTCDate() === 31 &&
    from.getUTCFullYear() === to.getUTCFullYear();

  return isFullYear
    ? String(from.getUTCFullYear())
    : `${formatDate(from)}–${formatDate(to)}`;
}

// Days remaining until (and including) to_date, or a finished label once
// it's passed. Compares by calendar date, not exact time, since to_date
// has no time component of its own.
function dateStatus(toDate: Date | null): string | null {
  if (!toDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);
  const diffDays = Math.round((to.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return "Avslutad";
  if (diffDays === 0) return "Sista dagen";
  return `${diffDays} ${diffDays === 1 ? "dag" : "dagar"} kvar`;
}

// Groups cm values by decade (70-79, 80-89, ...) so each decade renders as
// its own row, in cm order.
function groupByDecade(min: number, max: number): [number, number[]][] {
  const groups = new Map<number, number[]>();
  for (let cm = min; cm <= max; cm++) {
    const decade = Math.floor(cm / 10) * 10;
    const list = groups.get(decade);
    if (list) {
      list.push(cm);
    } else {
      groups.set(decade, [cm]);
    }
  }
  return Array.from(groups.entries());
}

function BingoCell({
  cm,
  matches,
  selected,
  onSelect,
}: {
  cm: number;
  matches: BingoCatch[] | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  if (!matches) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-black/10 text-[10px] text-zinc-500 sm:h-9 sm:w-9 sm:text-xs dark:bg-white/10 dark:text-zinc-400">
        {cm}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[10px] font-medium text-white transition-colors sm:h-9 sm:w-9 sm:text-xs " +
        (selected
          ? "bg-green-700 ring-2 ring-green-700 ring-offset-1 dark:ring-offset-zinc-900"
          : "bg-green-600 hover:bg-green-700")
      }
    >
      {cm}
    </button>
  );
}

// Whichever matched cell is tapped, its catches show in one panel below the
// whole grid instead of a popup anchored to the cell itself -- a popup
// wide/tall enough to list several catches would otherwise overlap
// neighboring cells (in the same column below it, or adjacent decade
// columns beside it), either hiding their content behind it or, if raised
// above them with z-index, having THEM cut into the popup's own text.
// A single panel that never overlaps the grid sidesteps the whole problem.
function CellDetailPanel({
  cm,
  matches,
  onClose,
}: {
  cm: number;
  matches: BingoCatch[];
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 text-sm dark:border-white/15 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium">{cm} cm</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          ×
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {matches.map((c) => (
          <li key={c.id}>
            <Link
              href={`/register/${c.id}`}
              className="block rounded-md px-1 py-0.5 -mx-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <p className="font-medium underline-offset-2 hover:underline">
                {c.angler_name}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                {c.length_cm} cm
                {c.weight_kg != null ? ` · ${c.weight_kg} kg` : ""} ·{" "}
                {formatDate(c.caught_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BingoCardGrid({
  card,
  catchesByCm,
}: {
  card: BingoCard;
  catchesByCm: Map<number, BingoCatch[]>;
}) {
  const [selectedCm, setSelectedCm] = useState<number | null>(null);
  const decadeRows = groupByDecade(card.min_cm, card.max_cm);
  const totalCount = decadeRows.reduce((sum, [, cms]) => sum + cms.length, 0);
  const doneCount = decadeRows.reduce(
    (sum, [, cms]) => sum + cms.filter((cm) => catchesByCm.has(cm)).length,
    0
  );
  const status = dateStatus(card.to_date);
  const selectedMatches = selectedCm != null ? catchesByCm.get(selectedCm) : undefined;

  return (
    <details className="rounded-xl border border-black/10 bg-white p-2 sm:p-5 dark:border-white/15 dark:bg-white/5">
      <summary className="flex cursor-pointer list-none flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {card.name || `${card.species} ${card.min_cm}–${card.max_cm} cm`}
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
              {card.team_id ? "Team" : "Ensam"}
            </span>
            {card.archived_at ? (
              <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                Arkiverad
              </span>
            ) : (
              status && (
                <span
                  className={
                    "ml-2 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-normal " +
                    (status === "Avslutad"
                      ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")
                  }
                >
                  {status}
                </span>
              )
            )}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {card.name && <>{card.species} {card.min_cm}–{card.max_cm} cm · </>}
            {doneCount}/{totalCount} fångade
            {card.from_date && card.to_date && (
              <> · {formatDateRange(card.from_date, card.to_date)}</>
            )}
          </p>
        </div>
      </summary>

      <div className="mt-3 flex flex-col gap-3">
        <BingoCardEditForm
          cardId={card.id}
          currentName={card.name}
          currentFromDate={card.from_date}
          currentToDate={card.to_date}
        />

        <div className="flex items-center justify-between gap-3">
          <form action={card.archived_at ? unarchiveBingoCard : archiveBingoCard}>
            <input type="hidden" name="id" value={card.id} />
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-black/5 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/10"
            >
              {card.archived_at ? "Återställ bingobricka" : "Arkivera bingobricka"}
            </button>
          </form>

          <ConfirmDeleteButton
            action={deleteBingoCard}
            id={card.id}
            label="Ta bort bingobricka"
          />
        </div>
        {/* One row per decade, values running left to right within it
            (70–79 in row 1, 80–89 in row 2, ...). Each cell is placed
            explicitly by its own ones-digit (column) and decade index (row)
            instead of relying on source order, so a range that doesn't start
            on a round decade (e.g. 72–115) still lines up — 72 lands in the
            "2" column of its decade instead of shifting the whole row over.
            self-start keeps the grid sized to its own content — without it,
            the flex-col parent's default cross-axis stretch would make the
            grid (and so its auto rows) fill the card's full width, leaving
            each cell much wider than 28px. The wrapper scrolls horizontally
            as a fallback for a decade with all 10 ones-digits on the
            narrowest phones, rather than overflowing the page. */}
        <div className="max-w-full overflow-x-auto">
          <div
            className="inline-grid gap-px"
            style={{
              gridTemplateRows: `repeat(${decadeRows.length}, auto)`,
            }}
          >
            {decadeRows.flatMap(([, cms], rowIndex) =>
              cms.map((cm) => (
                <div
                  key={cm}
                  style={{ gridRow: rowIndex + 1, gridColumn: (cm % 10) + 1 }}
                >
                  <BingoCell
                    cm={cm}
                    matches={catchesByCm.get(cm)}
                    selected={selectedCm === cm}
                    onSelect={() => setSelectedCm((prev) => (prev === cm ? null : cm))}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {selectedCm != null && selectedMatches && (
          <CellDetailPanel
            cm={selectedCm}
            matches={selectedMatches}
            onClose={() => setSelectedCm(null)}
          />
        )}
      </div>
    </details>
  );
}
