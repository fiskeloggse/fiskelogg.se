"use client";

import { useState } from "react";
import { deleteCatch } from "@/app/actions/catches";
import type { Catch } from "./catch-list";
import ConfirmDeleteButton from "./confirm-delete-button";
import EditCatchForm from "./edit-catch-form";
import {
  DateColumnFilter,
  MeasurementColumnFilter,
  SelectColumnFilter,
} from "./register-header-filters";

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
}: {
  catches: Catch[];
  currentUserId: number;
  speciesOptions: string[];
  lakeOptions: string[];
  baitOptions: string[];
}) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const totalLength = catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg ?? 0), 0);
  const editingItem = catches.find((c) => c.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      {editingItem && (
        <EditCatchForm item={editingItem} onClose={() => setEditingId(null)} />
      )}

      <div className="flex flex-col gap-1.5">
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                <th className="px-1 py-2 font-medium">
                  <DateColumnFilter />
                </th>
                <th className="px-1 py-2 font-medium">
                  <SelectColumnFilter
                    label="Art"
                    paramName="species"
                    options={speciesOptions}
                  />
                </th>
                <th className="px-1 py-2 font-medium">
                  <SelectColumnFilter
                    label="Plats"
                    paramName="lake"
                    options={lakeOptions}
                    widthClass="w-14"
                  />
                </th>
                <th className="px-1 py-2 text-right font-medium">
                  <MeasurementColumnFilter />
                </th>
                <th className="px-1 py-2 font-medium">
                  <SelectColumnFilter
                    label="Bete"
                    paramName="bait"
                    options={baitOptions}
                    widthClass="w-14"
                  />
                </th>
                <th className="px-1 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {catches.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                      className={
                        item.id === editingId ? "bg-black/5 dark:bg-white/10" : undefined
                      }
                    >
                      <td
                        className="px-1 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                        title={formatDateFull(item.caught_at)}
                      >
                        {formatDate(item.caught_at)}
                      </td>
                      <td className="px-1 py-2">
                        {item.species || "Okänd art"}
                        {item.angler_name && (
                          <span className="text-zinc-400 dark:text-zinc-500">
                            {" "}
                            · {item.angler_name}
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-2 text-zinc-500 dark:text-zinc-400">
                        {place || "–"}
                      </td>
                      <td className="px-1 py-2 text-right whitespace-nowrap">
                        {item.length_cm ?? "–"}/
                        {item.weight_kg != null ? formatSv(item.weight_kg) : "–"}
                      </td>
                      <td className="px-1 py-2 text-zinc-500 dark:text-zinc-400">
                        {item.bait || "–"}
                      </td>
                      <td className="px-1 py-2 text-right whitespace-nowrap">
                        {item.user_id === currentUserId && (
                          <div className="flex items-center justify-end">
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
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 font-medium dark:border-white/15">
                <td className="px-1 py-2" colSpan={3}>
                  Totalt · {catches.length}{" "}
                  {catches.length === 1 ? "fångst" : "fångster"}
                </td>
                <td className="px-1 py-2 text-right whitespace-nowrap">
                  {roundTo2(totalLength)}/{formatSv(totalWeight)}
                  <br />
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    ({formatSv(totalLength / 100)} m)
                  </span>
                </td>
                <td className="px-1 py-2" />
                <td className="px-1 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
