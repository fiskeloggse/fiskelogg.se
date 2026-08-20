"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCatch } from "@/app/actions/catches";
import type { Catch } from "./catch-list";
import ConfirmDeleteButton from "./confirm-delete-button";
import EditCatchForm from "./edit-catch-form";
import {
  DateColumnFilter,
  MeasurementColumnFilter,
  SelectColumnFilter,
} from "./register-header-filters";
import { REGISTER_COLUMN_KEYS } from "@/lib/constants";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function formatDateFull(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatSv(n: number): string {
  return roundTo2(n).toString().replace(".", ",");
}

export default function CatchTable({
  catches,
  currentUserId,
  speciesOptions,
  lakeOptions,
  baitOptions,
  visibleColumns,
}: {
  catches: Catch[];
  currentUserId: number;
  speciesOptions: string[];
  lakeOptions: string[];
  baitOptions: string[];
  visibleColumns: string[] | null;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);

  const visible = visibleColumns ?? REGISTER_COLUMN_KEYS;
  const showDatum = visible.includes("datum");
  const showArt = visible.includes("art");
  const showPlats = visible.includes("plats");
  const showMatt = visible.includes("matt");
  const showBete = visible.includes("bete");
  const labelSpan =
    [showDatum, showArt, showPlats, showBete].filter(Boolean).length || 1;
  const totalColumns =
    [showDatum, showArt, showPlats, showMatt, showBete].filter(Boolean).length +
    (editMode ? 1 : 0);

  const totalLength = catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg ?? 0), 0);
  const editingItem = catches.find((c) => c.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      {editingItem && (
        <EditCatchForm item={editingItem} onClose={() => setEditingId(null)} />
      )}

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className="self-end text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
        >
          {editMode ? "Klar" : "Redigera"}
        </button>
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                {showDatum && (
                  <th className="px-1 py-2 font-medium">
                    <DateColumnFilter />
                  </th>
                )}
                {showArt && (
                  <th className="px-1 py-2 font-medium">
                    <SelectColumnFilter
                      label="Art"
                      paramName="species"
                      options={speciesOptions}
                    />
                  </th>
                )}
                {showPlats && (
                  <th className="px-1 py-2 font-medium">
                    <SelectColumnFilter
                      label="Plats"
                      paramName="lake"
                      options={lakeOptions}
                      widthClass="w-14"
                    />
                  </th>
                )}
                {showMatt && (
                  <th className="px-1 py-2 text-right font-medium">
                    <MeasurementColumnFilter />
                  </th>
                )}
                {showBete && (
                  <th className="px-1 py-2 font-medium">
                    <SelectColumnFilter
                      label="Bete"
                      paramName="bait"
                      options={baitOptions}
                      widthClass="w-14"
                    />
                  </th>
                )}
                {editMode && <th className="px-1 py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {catches.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-2 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    Inga fångster matchar filtret.
                  </td>
                </tr>
              ) : (
                catches.map((item) => {
                  const place = [item.lake, item.location]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/register/${item.id}`)}
                      className={
                        "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 " +
                        (item.id === editingId ? "bg-black/5 dark:bg-white/10" : "")
                      }
                    >
                      {showDatum && (
                        <td
                          className="px-1 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                          title={formatDateFull(item.caught_at)}
                        >
                          {formatDate(item.caught_at)}
                        </td>
                      )}
                      {showArt && (
                        <td className="px-1 py-2">
                          {item.species || "Okänd art"}
                          {item.angler_name && (
                            <span className="text-zinc-400 dark:text-zinc-500">
                              {" "}
                              · {item.angler_name}
                            </span>
                          )}
                        </td>
                      )}
                      {showPlats && (
                        <td className="px-1 py-2 text-zinc-500 dark:text-zinc-400">
                          {place || "–"}
                        </td>
                      )}
                      {showMatt && (
                        <td className="px-1 py-2 text-right whitespace-nowrap">
                          {item.length_cm ?? "–"}/
                          {item.weight_kg != null ? formatSv(item.weight_kg) : "–"}
                        </td>
                      )}
                      {showBete && (
                        <td className="px-1 py-2 text-zinc-500 dark:text-zinc-400">
                          {item.bait || "–"}
                        </td>
                      )}
                      {editMode && (
                        <td className="px-1 py-2 text-right whitespace-nowrap">
                          {item.user_id === currentUserId && (
                            <div
                              className="flex items-center justify-end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingId(item.id === editingId ? null : item.id)
                                }
                                aria-label={
                                  item.id === editingId
                                    ? "Avbryt redigering"
                                    : "Redigera fångst"
                                }
                                className="shrink-0 px-0.5 text-base leading-none text-zinc-400 transition-colors hover:text-foreground dark:text-zinc-500"
                              >
                                {item.id === editingId ? "×" : "✏️"}
                              </button>
                              <ConfirmDeleteButton
                                action={deleteCatch}
                                id={item.id}
                                label="Ta bort fångst"
                                compact
                              />
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 font-medium dark:border-white/15">
                <td className="px-1 py-2" colSpan={labelSpan}>
                  Totalt · {catches.length}{" "}
                  {catches.length === 1 ? "fångst" : "fångster"}
                </td>
                {showMatt && (
                  <td className="px-1 py-2 text-right whitespace-nowrap">
                    {roundTo2(totalLength)}/{formatSv(totalWeight)}
                    <br />
                    <span className="font-normal text-zinc-500 dark:text-zinc-400">
                      ({formatSv(totalLength / 100)} m)
                    </span>
                  </td>
                )}
                {editMode && <td className="px-1 py-2" />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
