"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LENGTH_MAX,
  LENGTH_MIN,
  MONTHS,
  WEIGHT_MAX,
  WEIGHT_MIN,
  WEATHER_TEMP_MIN,
  WEATHER_TEMP_MAX,
  WEATHER_WIND_MIN,
  WEATHER_WIND_MAX,
  WEATHER_PRESSURE_MIN,
  WEATHER_PRESSURE_MAX,
} from "@/lib/constants";
import DualRangeSlider from "./dual-range-slider";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-transparent";

const POPOVER_WIDTH = 224; // matches w-56

// The table this lives in scrolls horizontally (overflow-x-auto), which
// clips any absolutely-positioned child. Portal the panel to <body> and
// position it with fixed coordinates from the trigger's bounding rect so
// it's never cut off, especially on narrow mobile viewports.
export function HeaderPopover({
  label,
  active,
  children,
  triggerClassName,
}: {
  label: string;
  active: boolean;
  children: (close: () => void) => React.ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleScroll(e: Event) {
      // Scrolling the option list inside the popover itself dispatches a
      // "scroll" event too (capture phase sees it on the way down) — only
      // close for scrolling outside the popover (the page/table behind it).
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    // Opening focuses the trigger, which can itself trigger the browser's
    // native "scroll focused element into view" — attach the scroll-closer
    // a tick later so that settles first instead of closing what we just opened.
    const timer = window.setTimeout(() => {
      window.addEventListener("scroll", handleScroll, true);
    }, 150);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - POPOVER_WIDTH - 8
      );
      setCoords({ top: rect.bottom + 4, left });
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={
          triggerClassName ??
          "cursor-pointer font-medium " +
            (active ? "text-foreground" : "hover:text-foreground")
        }
      >
        {label}
        {active && " •"}
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left, width: POPOVER_WIDTH }}
            className="fixed z-50 rounded-lg border border-black/10 bg-white p-3 text-sm font-normal normal-case shadow-lg dark:border-white/15 dark:bg-zinc-900"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body
        )}
    </>
  );
}

export function useApply() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function apply(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    router.replace(`${pathname}?${params.toString()}`);
  };
}

export function SelectColumnFilter({
  label,
  paramName,
  options,
}: {
  label: string;
  paramName: string;
  options: string[];
}) {
  const searchParams = useSearchParams();
  const apply = useApply();
  const current = searchParams.get(paramName) ?? "";
  const active = current !== "";

  function optionClassName(selected: boolean) {
    return (
      "rounded px-2 py-1.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 " +
      (selected ? "font-medium text-foreground" : "text-zinc-500 dark:text-zinc-400")
    );
  }

  return (
    <HeaderPopover label={label} active={active}>
      {(close) => (
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto text-sm">
          <button
            type="button"
            onClick={() => {
              apply((params) => params.delete(paramName));
              close();
            }}
            className={optionClassName(!active)}
          >
            Alla
          </button>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                apply((params) => params.set(paramName, o));
                close();
              }}
              className={optionClassName(current === o)}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </HeaderPopover>
  );
}

function SortToggle({
  label,
  sortAsc,
  sortDesc,
}: {
  label: string;
  sortAsc: string;
  sortDesc: string;
}) {
  const searchParams = useSearchParams();
  const apply = useApply();
  const currentSort = searchParams.get("sort") ?? "date-desc";
  const isAsc = currentSort === sortAsc;
  const isActive = isAsc || currentSort === sortDesc;

  return (
    <button
      type="button"
      onClick={() => apply((params) => params.set("sort", isAsc ? sortDesc : sortAsc))}
      className={
        "text-xs underline hover:text-foreground " +
        (isActive
          ? "text-foreground"
          : "text-zinc-500 dark:text-zinc-400")
      }
    >
      {label}: {isAsc ? "störst först" : "minst först"}
    </button>
  );
}

// Combines Längd and Vikt into one column ("90/4,5") with a single popup
// holding a dual-range slider per measurement, plus a sort toggle each.
export function MeasurementColumnFilter() {
  const searchParams = useSearchParams();
  const apply = useApply();
  const currentLengthMin = searchParams.get("lengthMin");
  const currentLengthMax = searchParams.get("lengthMax");
  const currentWeightMin = searchParams.get("weightMin");
  const currentWeightMax = searchParams.get("weightMax");
  const [lengthRange, setLengthRange] = useState<[number, number]>([
    currentLengthMin ? Number(currentLengthMin) : LENGTH_MIN,
    currentLengthMax ? Number(currentLengthMax) : LENGTH_MAX,
  ]);
  const [weightRange, setWeightRange] = useState<[number, number]>([
    currentWeightMin ? Number(currentWeightMin) : WEIGHT_MIN,
    currentWeightMax ? Number(currentWeightMax) : WEIGHT_MAX,
  ]);
  const active = Boolean(
    currentLengthMin || currentLengthMax || currentWeightMin || currentWeightMax
  );

  return (
    <HeaderPopover label="Storlek" active={active}>
      {(close) => (
        <div className="flex flex-col gap-3 text-sm">
          <DualRangeSlider
            label="Längd"
            min={LENGTH_MIN}
            max={LENGTH_MAX}
            step={1}
            value={lengthRange}
            onChange={setLengthRange}
            unit="cm"
          />
          <DualRangeSlider
            label="Vikt"
            min={WEIGHT_MIN}
            max={WEIGHT_MAX}
            step={0.1}
            value={weightRange}
            onChange={setWeightRange}
            unit="kg"
          />
          <button
            type="button"
            onClick={() => {
              apply((params) => {
                if (lengthRange[0] > LENGTH_MIN) {
                  params.set("lengthMin", String(lengthRange[0]));
                } else {
                  params.delete("lengthMin");
                }
                if (lengthRange[1] < LENGTH_MAX) {
                  params.set("lengthMax", String(lengthRange[1]));
                } else {
                  params.delete("lengthMax");
                }
                if (weightRange[0] > WEIGHT_MIN) {
                  params.set("weightMin", String(weightRange[0]));
                } else {
                  params.delete("weightMin");
                }
                if (weightRange[1] < WEIGHT_MAX) {
                  params.set("weightMax", String(weightRange[1]));
                } else {
                  params.delete("weightMax");
                }
              });
              close();
            }}
            className="self-start rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          >
            Filtrera
          </button>
          <div className="flex flex-col items-start gap-1">
            <SortToggle label="Längd" sortAsc="length-asc" sortDesc="length-desc" />
            <SortToggle label="Vikt" sortAsc="weight-asc" sortDesc="weight-desc" />
          </div>
        </div>
      )}
    </HeaderPopover>
  );
}

// One popup with a dual-range slider per weather value (temperatur, vind,
// lufttryck) — same pattern as MeasurementColumnFilter above.
export function WeatherColumnFilter() {
  const searchParams = useSearchParams();
  const apply = useApply();
  const currentTempMin = searchParams.get("weatherTempMin");
  const currentTempMax = searchParams.get("weatherTempMax");
  const currentWindMin = searchParams.get("weatherWindMin");
  const currentWindMax = searchParams.get("weatherWindMax");
  const currentPressureMin = searchParams.get("weatherPressureMin");
  const currentPressureMax = searchParams.get("weatherPressureMax");
  const [tempRange, setTempRange] = useState<[number, number]>([
    currentTempMin ? Number(currentTempMin) : WEATHER_TEMP_MIN,
    currentTempMax ? Number(currentTempMax) : WEATHER_TEMP_MAX,
  ]);
  const [windRange, setWindRange] = useState<[number, number]>([
    currentWindMin ? Number(currentWindMin) : WEATHER_WIND_MIN,
    currentWindMax ? Number(currentWindMax) : WEATHER_WIND_MAX,
  ]);
  const [pressureRange, setPressureRange] = useState<[number, number]>([
    currentPressureMin ? Number(currentPressureMin) : WEATHER_PRESSURE_MIN,
    currentPressureMax ? Number(currentPressureMax) : WEATHER_PRESSURE_MAX,
  ]);
  const active = Boolean(
    currentTempMin ||
      currentTempMax ||
      currentWindMin ||
      currentWindMax ||
      currentPressureMin ||
      currentPressureMax
  );

  return (
    <HeaderPopover label="Väder" active={active}>
      {(close) => (
        <div className="flex flex-col gap-3 text-sm">
          <DualRangeSlider
            label="Temperatur"
            min={WEATHER_TEMP_MIN}
            max={WEATHER_TEMP_MAX}
            step={1}
            value={tempRange}
            onChange={setTempRange}
            unit="°"
          />
          <DualRangeSlider
            label="Vind"
            min={WEATHER_WIND_MIN}
            max={WEATHER_WIND_MAX}
            step={1}
            value={windRange}
            onChange={setWindRange}
            unit="km/h"
          />
          <DualRangeSlider
            label="Lufttryck"
            min={WEATHER_PRESSURE_MIN}
            max={WEATHER_PRESSURE_MAX}
            step={1}
            value={pressureRange}
            onChange={setPressureRange}
            unit="hPa"
          />
          <button
            type="button"
            onClick={() => {
              apply((params) => {
                if (tempRange[0] > WEATHER_TEMP_MIN) {
                  params.set("weatherTempMin", String(tempRange[0]));
                } else {
                  params.delete("weatherTempMin");
                }
                if (tempRange[1] < WEATHER_TEMP_MAX) {
                  params.set("weatherTempMax", String(tempRange[1]));
                } else {
                  params.delete("weatherTempMax");
                }
                if (windRange[0] > WEATHER_WIND_MIN) {
                  params.set("weatherWindMin", String(windRange[0]));
                } else {
                  params.delete("weatherWindMin");
                }
                if (windRange[1] < WEATHER_WIND_MAX) {
                  params.set("weatherWindMax", String(windRange[1]));
                } else {
                  params.delete("weatherWindMax");
                }
                if (pressureRange[0] > WEATHER_PRESSURE_MIN) {
                  params.set("weatherPressureMin", String(pressureRange[0]));
                } else {
                  params.delete("weatherPressureMin");
                }
                if (pressureRange[1] < WEATHER_PRESSURE_MAX) {
                  params.set("weatherPressureMax", String(pressureRange[1]));
                } else {
                  params.delete("weatherPressureMax");
                }
              });
              close();
            }}
            className="self-start rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          >
            Filtrera
          </button>
        </div>
      )}
    </HeaderPopover>
  );
}

export function DateColumnFilter() {
  const searchParams = useSearchParams();
  const apply = useApply();
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";
  const currentMonths = searchParams.getAll("month");
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);
  const [months, setMonths] = useState<string[]>(currentMonths);
  const active = Boolean(currentFrom || currentTo || currentMonths.length > 0);
  const currentSort = searchParams.get("sort") ?? "date-desc";
  const isDateAsc = currentSort === "date-asc";

  return (
    <HeaderPopover label="Datum" active={active}>
      {(close) => (
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Från
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-1">
            Till
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClassName}
            />
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Filtrerar på årstid (dag/månad), året spelar ingen roll.
          </p>
          <div className="flex flex-wrap gap-1">
            {MONTHS.map((m) => {
              const value = String(m.value);
              const checked = months.includes(value);
              return (
                <label key={m.value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setMonths((prev) =>
                        e.target.checked
                          ? [...prev, value]
                          : prev.filter((v) => v !== value)
                      )
                    }
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border border-black/10 px-2 py-0.5 text-xs transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background dark:border-white/15">
                    {m.label.slice(0, 3)}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                apply((params) => {
                  if (from) params.set("from", from);
                  else params.delete("from");
                  if (to) params.set("to", to);
                  else params.delete("to");
                  params.delete("month");
                  months.forEach((m) => params.append("month", m));
                });
                close();
              }}
              className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            >
              Filtrera
            </button>
            <button
              type="button"
              onClick={() =>
                apply((params) => {
                  params.set("sort", isDateAsc ? "date-desc" : "date-asc");
                })
              }
              className="text-xs text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
            >
              {isDateAsc ? "Nyast först" : "Äldst först"}
            </button>
          </div>
        </div>
      )}
    </HeaderPopover>
  );
}
