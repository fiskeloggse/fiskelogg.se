"use client";

import { useState } from "react";
import type { FishingDaysRow } from "@/lib/stats";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

export default function FishingDaysChart({ data }: { data: FishingDaysRow[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Inga fångster loggade än.
      </p>
    );
  }

  const years = Array.from(new Set(data.map((d) => d.year))).sort(
    (a, b) => a - b
  );
  const yearTotals = years.map((year) => ({
    year,
    days: data
      .filter((d) => d.year === year)
      .reduce((sum, d) => sum + d.days, 0),
  }));

  if (selectedYear !== null) {
    const monthData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = data.find(
        (d) => d.year === selectedYear && d.month === month
      );
      return { month, days: found?.days ?? 0 };
    });
    const max = Math.max(1, ...monthData.map((d) => d.days));

    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setSelectedYear(null)}
          className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
        >
          ← Alla år
        </button>
        <p className="text-sm font-medium">Fiskedagar {selectedYear}</p>
        <div className="flex h-32 items-end gap-1.5 sm:gap-2">
          {monthData.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className="w-full rounded-t bg-foreground/70"
                  style={{ height: `${(d.days / max) * 100}%` }}
                  title={`${d.days} dagar`}
                />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {MONTH_LABELS[d.month - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const max = Math.max(1, ...yearTotals.map((d) => d.days));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Fiskedagar per år</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Klicka på ett år för att se per månad.
      </p>
      <div className="flex h-32 items-end gap-2 sm:gap-3">
        {yearTotals.map((d) => (
          <button
            key={d.year}
            type="button"
            onClick={() => setSelectedYear(d.year)}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t bg-foreground/70 transition-colors hover:bg-foreground"
                style={{ height: `${(d.days / max) * 100}%` }}
                title={`${d.days} dagar`}
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {d.year}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
