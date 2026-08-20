"use client";

import { useState } from "react";
import { deleteCatch } from "@/app/actions/catches";
import type { Catch } from "./catch-list";
import ConfirmDeleteButton from "./confirm-delete-button";
import EditCatchForm from "./edit-catch-form";
import {
  DateColumnFilter,
  RangeColumnFilter,
  SelectColumnFilter,
} from "./register-header-filters";
import { LENGTH_MAX, LENGTH_MIN, WEIGHT_MAX, WEIGHT_MIN } from "@/lib/constants";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
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
        <p className="text-xs text-zinc-400 sm:hidden dark:text-zinc-500">
          ← Bläddra sidledes för fler kolumner →
        </p>
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                <th className="px-4 py-2 font-medium">
                  <DateColumnFilter />
                </th>
                <th className="px-4 py-2 font-medium">
                  <SelectColumnFilter
                    label="Art"
                    paramName="species"
                    options={speciesOptions}
                  />
                </th>
                <th className="px-4 py-2 font-medium">
                  <SelectColumnFilter
                    label="Plats"
                    paramName="lake"
                    options={lakeOptions}
                  />
                </th>
                <th className="px-4 py-2 font-medium">
                  <SelectColumnFilter
                    label="Bete"
                    paramName="bait"
                    options={baitOptions}
                  />
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  <RangeColumnFilter
                    label="Längd (cm)"
                    minParam="lengthMin"
                    maxParam="lengthMax"
                    min={LENGTH_MIN}
                    max={LENGTH_MAX}
                    unit="cm"
                    sortAsc="length-asc"
                    sortDesc="length-desc"
                  />
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  <RangeColumnFilter
                    label="Vikt (kg)"
                    minParam="weightMin"
                    maxParam="weightMax"
                    min={WEIGHT_MIN}
                    max={WEIGHT_MAX}
                    unit="kg"
                    sortAsc="weight-asc"
                    sortDesc="weight-desc"
                  />
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {catches.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
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
                      <td className="px-4 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        {formatDate(item.caught_at)}
                      </td>
                      <td className="px-4 py-2">
                        {item.species || "Okänd art"}
                        {item.angler_name && (
                          <span className="text-zinc-400 dark:text-zinc-500">
                            {" "}
                            · {item.angler_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                        {place || "–"}
                      </td>
                      <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                        {item.bait || "–"}
                      </td>
                      <td className="px-4 py-2 text-right">{item.length_cm ?? "–"}</td>
                      <td className="px-4 py-2 text-right">{item.weight_kg ?? "–"}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {item.user_id === currentUserId && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingId(item.id === editingId ? null : item.id)
                              }
                              className="text-sm text-zinc-500 underline transition-colors hover:text-foreground dark:text-zinc-400"
                            >
                              {item.id === editingId ? "Redigerar" : "Redigera"}
                            </button>
                            <ConfirmDeleteButton
                              action={deleteCatch}
                              id={item.id}
                              label="Ta bort fångst"
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
                <td className="px-4 py-2" colSpan={4}>
                  Totalt · {catches.length}{" "}
                  {catches.length === 1 ? "fångst" : "fångster"}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {roundTo2(totalLength)} cm ({roundTo2(totalLength / 100)} m)
                </td>
                <td className="px-4 py-2 text-right">{roundTo2(totalWeight)} kg</td>
                <td className="px-4 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
