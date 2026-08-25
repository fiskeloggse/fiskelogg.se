"use client";

import { useState } from "react";
import type { FishingDayRow } from "@/lib/stats";

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

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function FishingDaysExplorer({
  fishingDays,
  onBack,
}: {
  fishingDays: FishingDayRow[];
  onBack: () => void;
}) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const byDate = new Map(fishingDays.map((d) => [d.date, d.catches]));
  const years = Array.from(
    new Set(fishingDays.map((d) => Number(d.date.slice(0, 4))))
  ).sort((a, b) => a - b);

  function goBack() {
    if (selectedMonth !== null) setSelectedMonth(null);
    else if (selectedYear !== null) setSelectedYear(null);
    else onBack();
  }

  const backButton = (
    <button
      type="button"
      onClick={goBack}
      className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
    >
      ← Tillbaka
    </button>
  );

  if (fishingDays.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {backButton}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Inga fångster loggade än.
        </p>
      </div>
    );
  }

  // Calendar view (year + month selected)
  if (selectedYear !== null && selectedMonth !== null) {
    const weeks = buildCalendarWeeks(selectedYear, selectedMonth);
    return (
      <div className="flex flex-col gap-3">
        {backButton}
        <p className="text-sm font-medium">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-zinc-500 dark:text-zinc-400">
              {label}
            </div>
          ))}
          {weeks.flatMap((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={`${weekIndex}-${dayIndex}`} />;
              }
              const dateStr = `${selectedYear}-${pad2(selectedMonth)}-${pad2(day)}`;
              const count = byDate.get(dateStr) ?? 0;
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  title={count > 0 ? `${count} fångster` : undefined}
                  className={
                    "flex aspect-square flex-col items-center justify-center rounded-lg text-xs " +
                    (count > 0
                      ? "bg-foreground text-background font-medium"
                      : "bg-black/5 text-zinc-400 dark:bg-white/10 dark:text-zinc-500")
                  }
                >
                  <span>{day}</span>
                  {count > 0 && <span className="text-[10px]">{count}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Month view (year selected)
  if (selectedYear !== null) {
    const monthData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const mm = pad2(month);
      const days = fishingDays.filter((d) =>
        d.date.startsWith(`${selectedYear}-${mm}-`)
      ).length;
      return { month, days };
    });
    const max = Math.max(1, ...monthData.map((d) => d.days));

    return (
      <div className="flex flex-col gap-3">
        {backButton}
        <p className="text-sm font-medium">Fiskedagar {selectedYear}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Klicka på en månad för att se kalendervyn.
        </p>
        <div className="flex h-32 items-end gap-1.5 sm:gap-2">
          {monthData.map((d) => (
            <button
              key={d.month}
              type="button"
              disabled={d.days === 0}
              onClick={() => setSelectedMonth(d.month)}
              className="flex flex-1 flex-col items-center gap-1 disabled:cursor-default"
            >
              <div className="flex h-24 w-full items-end">
                <div
                  className={
                    "w-full rounded-t " +
                    (d.days > 0
                      ? "bg-foreground/70 transition-colors hover:bg-foreground"
                      : "bg-black/5 dark:bg-white/10")
                  }
                  style={{ height: `${(d.days / max) * 100}%` }}
                  title={`${d.days} dagar`}
                />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {MONTH_LABELS[d.month - 1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Year view (top level)
  const yearTotals = years.map((year) => ({
    year,
    days: fishingDays.filter((d) => d.date.startsWith(`${year}-`)).length,
  }));
  const max = Math.max(1, ...yearTotals.map((d) => d.days));

  return (
    <div className="flex flex-col gap-3">
      {backButton}
      <p className="text-sm font-medium">Fiskedagar per år</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Klicka på ett år för att se per månad.
      </p>
      <div className="flex flex-col gap-2">
        {yearTotals.map((d) => (
          <button
            key={d.year}
            type="button"
            onClick={() => setSelectedYear(d.year)}
            className="flex w-full items-center gap-3 text-sm hover:opacity-80"
          >
            <span className="w-12 shrink-0 text-left text-zinc-500 dark:text-zinc-400">
              {d.year}
            </span>
            <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10">
              <div
                className="h-2 rounded-full bg-foreground/70"
                style={{ width: `${(d.days / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
              {d.days}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
