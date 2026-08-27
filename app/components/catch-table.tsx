"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteCatches } from "@/app/actions/catches";
import type { Catch } from "./catch-list";
import ConfirmDialog from "./confirm-dialog";
import {
  DateColumnFilter,
  MeasurementColumnFilter,
  SelectColumnFilter,
  WeatherColumnFilter,
} from "./register-header-filters";
import { REGISTER_COLUMN_KEYS, WEATHER_DESCRIPTION_ICONS } from "@/lib/constants";
import { getMoonPhase } from "@/lib/moon-phase";

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
  const searchParams = useSearchParams();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const bulkDeleteFormRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // The table can be wider than its container (more columns than fit on a
  // phone screen) — without this, there's no hint that Väder/Månfas etc.
  // are just a swipe away instead of missing.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
    };
    update();
    el.addEventListener("scroll", update);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [catches, visibleColumns]);

  const visible = visibleColumns ?? REGISTER_COLUMN_KEYS;
  const showDatum = visible.includes("datum");
  const showArt = visible.includes("art");
  const showPlats = visible.includes("plats");
  const showMatt = visible.includes("matt");
  const showBete = visible.includes("bete");
  const showVader = visible.includes("vader");
  const showManfas = visible.includes("manfas");
  const labelSpan =
    [showDatum, showArt, showPlats, showBete].filter(Boolean).length || 1;
  const totalColumns =
    [showDatum, showArt, showPlats, showMatt, showBete, showVader, showManfas].filter(
      Boolean
    ).length + (selectMode ? 1 : 0);

  const totalLength = catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg ?? 0), 0);

  const ownCatches = catches.filter((c) => c.user_id === currentUserId);
  const allSelected =
    ownCatches.length > 0 && ownCatches.every((c) => selectedIds.has(c.id));

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
    setConfirming(false);
  }

  function toggleRow(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(ownCatches.map((c) => c.id)));
  }

  async function handleBulkDelete(formData: FormData) {
    await deleteCatches(formData);
    setSelectedIds(new Set());
    setConfirming(false);
    setSelectMode(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {selectMode ? (
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
            >
              {allSelected ? "Avmarkera alla" : "Markera alla"}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={toggleSelectMode}
            className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
          >
            {selectMode ? "Klar" : "Markera"}
          </button>
        </div>

        {selectMode && selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="self-end rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white dark:bg-red-700"
          >
            Radera valda ({selectedIds.size})
          </button>
        )}

        <form ref={bulkDeleteFormRef} action={handleBulkDelete} className="hidden">
          {[...selectedIds].map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
        </form>

        <ConfirmDialog
          open={confirming}
          title={`Radera ${selectedIds.size} ${
            selectedIds.size === 1 ? "fångst" : "fångster"
          }?`}
          description="Fångsterna flyttas till papperskorgen."
          confirmLabel="Ja, radera"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            bulkDeleteFormRef.current?.requestSubmit();
          }}
        />

        <div className="relative">
          <div
            ref={scrollRef}
            className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15"
          >
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15 dark:text-zinc-400">
                {selectMode && <th className="w-8 px-1 py-2" />}
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
                    />
                  </th>
                )}
                {showMatt && (
                  <th className="w-px px-1 py-2 text-right font-medium whitespace-nowrap">
                    <MeasurementColumnFilter />
                  </th>
                )}
                {showBete && (
                  <th className="px-1 py-2 font-medium">
                    <SelectColumnFilter
                      label="Metod/Bete"
                      paramName="bait"
                      options={baitOptions}
                    />
                  </th>
                )}
                {showVader && (
                  <th className="px-1 py-2 font-medium">
                    <WeatherColumnFilter />
                  </th>
                )}
                {showManfas && <th className="px-1 py-2 font-medium">Månfas</th>}
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
                  const selectable = item.user_id === currentUserId;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (selectMode) {
                          if (selectable) toggleRow(item.id);
                          return;
                        }
                        const query = searchParams.toString();
                        router.push(
                          `/register/${item.id}${query ? `?${query}` : ""}`
                        );
                      }}
                      className={
                        "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 " +
                        (selectedIds.has(item.id) ? "bg-black/5 dark:bg-white/10" : "")
                      }
                    >
                      {selectMode && (
                        <td
                          className="px-1 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {selectable && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleRow(item.id)}
                              aria-label="Markera fångst"
                              className="h-4 w-4"
                            />
                          )}
                        </td>
                      )}
                      {showDatum && (
                        <td
                          className="px-1 py-2 whitespace-nowrap"
                          title={formatDateFull(item.caught_at)}
                        >
                          {formatDate(item.caught_at)}
                          <br />
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {item.caught_at.getFullYear()}
                          </span>
                        </td>
                      )}
                      {showArt && (
                        <td className="px-1 py-2">
                          <div className="flex items-center gap-2">
                            {item.photo_url && (
                              // eslint-disable-next-line @next/next/no-img-element -- externally hosted blob URL, not a local/optimizable asset
                              <img
                                src={item.photo_url}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded object-cover"
                              />
                            )}
                            <span>
                              {item.species || "Okänd art"}
                              {item.angler_name && (
                                <span className="text-zinc-400 dark:text-zinc-500">
                                  {" "}
                                  · {item.angler_name}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                      )}
                      {showPlats && (
                        <td className="px-1 py-2 text-zinc-500 dark:text-zinc-400">
                          {item.lake || item.location ? (
                            <>
                              {item.lake && (
                                <div>
                                  {item.lake}
                                  {item.latitude != null &&
                                    item.longitude != null &&
                                    " 📍"}
                                </div>
                              )}
                              {item.location && (
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                                  {item.location}
                                </div>
                              )}
                            </>
                          ) : (
                            "–"
                          )}
                        </td>
                      )}
                      {showMatt && (
                        <td className="px-1 py-2 text-right whitespace-nowrap">
                          {item.length_cm != null ? `${item.length_cm} cm` : "–"}
                          <br />
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {item.weight_kg != null
                              ? `${formatSv(item.weight_kg)} kg`
                              : "–"}
                          </span>
                        </td>
                      )}
                      {showBete && (
                        <td className="px-1 py-2 text-zinc-500 dark:text-zinc-400">
                          {item.method || item.bait ? (
                            <>
                              {item.method && <div>{item.method}</div>}
                              {item.bait && (
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                                  {item.bait}
                                </div>
                              )}
                            </>
                          ) : (
                            "–"
                          )}
                        </td>
                      )}
                      {showVader && (
                        <td className="px-1 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                          {item.weather_description ? (
                            <>
                              <div title={item.weather_description}>
                                {WEATHER_DESCRIPTION_ICONS[item.weather_description] ??
                                  item.weather_description}
                                {item.weather_temp_c != null &&
                                  ` ${Math.round(item.weather_temp_c)}°`}
                              </div>
                              {item.weather_wind_kmh != null && (
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                                  {Math.round(item.weather_wind_kmh / 3.6)} m/s
                                </div>
                              )}
                              {item.weather_pressure_hpa != null && (
                                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                                  {Math.round(item.weather_pressure_hpa)} hPa
                                </div>
                              )}
                            </>
                          ) : (
                            "–"
                          )}
                        </td>
                      )}
                      {showManfas &&
                        (() => {
                          const moonPhase = getMoonPhase(item.caught_at);
                          return (
                            <td
                              className="px-1 py-2 text-center text-lg"
                              title={moonPhase.label}
                            >
                              {moonPhase.icon}
                            </td>
                          );
                        })()}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 font-medium dark:border-white/15">
                {selectMode && <td className="px-1 py-2" />}
                <td className="px-1 py-2" colSpan={labelSpan}>
                  Totalt · {catches.length}{" "}
                  {catches.length === 1 ? "fångst" : "fångster"}
                </td>
                {showMatt && (
                  <td className="px-1 py-2 text-right whitespace-nowrap">
                    {roundTo2(totalLength)} cm
                    <br />
                    <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                      ({formatSv(totalLength / 100)} m)
                    </span>
                    <br />
                    <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                      {formatSv(totalWeight)} kg
                    </span>
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
          </div>
          {canScrollLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-xl bg-gradient-to-r from-zinc-50 to-transparent dark:from-black" />
          )}
          {canScrollRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-xl bg-gradient-to-l from-zinc-50 to-transparent dark:from-black" />
          )}
        </div>
      </div>
    </div>
  );
}
