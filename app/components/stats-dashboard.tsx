"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  FishingDayRow,
  LakeStatsRow,
  MappedCatchRow,
  SpeciesBreakdownRow,
} from "@/lib/stats";
import type { PersonalBest } from "@/lib/personal-bests";
import { getStorfiskPercent } from "@/lib/storfisk";
import FishingDaysExplorer from "./fishing-days-explorer";
import PersonalBests from "./personal-bests";
import WatersMap from "./waters-map";

function StatCard({
  label,
  value,
  caption,
  active,
  onClick,
}: {
  label: string;
  value: number;
  caption?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border p-5 text-left transition-colors " +
        (active
          ? "border-foreground bg-black/5 dark:bg-white/10"
          : "border-black/10 bg-white hover:bg-black/5 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10")
      }
    >
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      {caption && (
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {caption}
        </p>
      )}
    </button>
  );
}

function CombinedStatCard({
  speciesCount,
  fishCount,
  active,
  onClick,
}: {
  speciesCount: number;
  fishCount: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border p-5 text-left transition-colors " +
        (active
          ? "border-foreground bg-black/5 dark:bg-white/10"
          : "border-black/10 bg-white hover:bg-black/5 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10")
      }
    >
      <div className="flex items-baseline gap-4">
        <div>
          <p className="text-2xl font-semibold">{speciesCount}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Antal arter
          </p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{fishCount}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Totalt antal fiskar
          </p>
        </div>
      </div>
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>;
}

function BarChart({
  rows,
  getHref,
}: {
  rows: { label: string; count: number; storfisk?: boolean }[];
  getHref?: (label: string) => string;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((r) => {
        const content = (
          <>
            <span className="flex w-24 shrink-0 items-center gap-1 truncate sm:w-32">
              {r.label}
              {r.storfisk && <span title="Storfisk">🎣</span>}
            </span>
            <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10">
              <div
                className="h-2 rounded-full bg-foreground/70"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
              {r.count}
            </span>
          </>
        );

        return getHref ? (
          <Link
            key={r.label}
            href={getHref(r.label)}
            className="flex w-full items-center gap-3 text-sm hover:opacity-80"
          >
            {content}
          </Link>
        ) : (
          <div key={r.label} className="flex items-center gap-3 text-sm">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function StatsDashboard({
  speciesBreakdown,
  lakeStats,
  fishingDays,
  personalBests,
  mappedCatches,
  initialExpanded = null,
}: {
  speciesBreakdown: SpeciesBreakdownRow[];
  lakeStats: LakeStatsRow[];
  fishingDays: FishingDayRow[];
  personalBests: PersonalBest[];
  mappedCatches: MappedCatchRow[];
  initialExpanded?: "species" | "personalbests" | null;
}) {
  const [expanded, setExpanded] = useState<
    "species" | "lakes" | "personalbests" | "fishingdays" | null
  >(initialExpanded);

  const speciesCount = speciesBreakdown.length;
  const lakeCount = lakeStats.length;
  const fishCount = speciesBreakdown.reduce((sum, s) => sum + s.count, 0);
  const fishingDaysCount = fishingDays.length;
  const hasAnyCatches = fishCount > 0;

  function speciesHref(species: string) {
    return `/statistik/${encodeURIComponent(species)}`;
  }

  function lakeHref(lake: string) {
    return `/statistik/vatten/${encodeURIComponent(lake)}`;
  }

  if (!hasAnyCatches) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Ingen statistik än. Logga din första fångst för att komma igång!
      </p>
    );
  }

  // Already ordered by count desc, highest first — straight from the query.
  const storfiskSpecies = new Set(
    personalBests
      .filter(
        (pb) =>
          pb.heaviest &&
          (getStorfiskPercent(pb.species, pb.heaviest.weight_kg) ?? 0) >= 100
      )
      .map((pb) => pb.species)
  );
  const speciesRows = speciesBreakdown.map((s) => ({
    label: s.species,
    count: s.count,
    storfisk: storfiskSpecies.has(s.species),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CombinedStatCard
          speciesCount={speciesCount}
          fishCount={fishCount}
          active={expanded === "species"}
          onClick={() => setExpanded(expanded === "species" ? null : "species")}
        />
        <StatCard
          label="Antal vatten"
          value={lakeCount}
          caption={mappedCatches.length > 0 ? "+ karta" : undefined}
          active={expanded === "lakes"}
          onClick={() => setExpanded(expanded === "lakes" ? null : "lakes")}
        />
        <StatCard
          label="Antal fiskedagar"
          value={fishingDaysCount}
          active={expanded === "fishingdays"}
          onClick={() =>
            setExpanded(expanded === "fishingdays" ? null : "fishingdays")
          }
        />
        <StatCard
          label="Storfisk"
          value={storfiskSpecies.size}
          caption={`av ${personalBests.length} personbästa`}
          active={expanded === "personalbests"}
          onClick={() =>
            setExpanded(expanded === "personalbests" ? null : "personalbests")
          }
        />
      </div>

      {expanded === "species" && (
        <div className="flex flex-col gap-6 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <div>
            <h2 className="text-lg font-semibold">Alla arter</h2>
            {speciesRows.length === 0 ? (
              <Empty>Inga fångster loggade än.</Empty>
            ) : (
              <BarChart rows={speciesRows} getHref={speciesHref} />
            )}
          </div>
        </div>
      )}

      {expanded === "fishingdays" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <FishingDaysExplorer
            fishingDays={fishingDays}
            onBack={() => setExpanded(null)}
          />
        </div>
      )}

      {expanded === "personalbests" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Personbästa</h2>
          <div className="mt-3">
            <PersonalBests bests={personalBests} getHref={speciesHref} />
          </div>
        </div>
      )}

      {expanded === "lakes" && (
        <div className="flex flex-col gap-6 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <div>
            <h2 className="text-lg font-semibold">Karta</h2>
            <div className="mt-3">
              {mappedCatches.length > 0 ? (
                <WatersMap catches={mappedCatches} />
              ) : (
                <Empty>Inga fångster med sparad position och vatten än.</Empty>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Alla vatten</h2>
            {lakeStats.length === 0 ? (
              <Empty>Inget vatten har fyllts i på några fångster än.</Empty>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {lakeStats.map((l) => (
                  <li key={l.lake}>
                    <Link
                      href={lakeHref(l.lake)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      <span className="font-medium">{l.lake}</span>
                      <span className="text-right text-zinc-500 dark:text-zinc-400">
                        {l.days} {l.days === 1 ? "dag" : "dagar"} · {l.platser}{" "}
                        {l.platser === 1 ? "plats" : "platser"} · {l.fish}{" "}
                        {l.fish === 1 ? "fisk" : "fiskar"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
