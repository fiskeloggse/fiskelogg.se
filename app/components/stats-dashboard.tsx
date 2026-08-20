"use client";

import { useState } from "react";
import type { FishingDayRow, LakeBreakdownRow, SpeciesBreakdownRow } from "@/lib/stats";
import type { PersonalBest } from "@/lib/personal-bests";
import FishingDaysExplorer from "./fishing-days-explorer";
import PersonalBests from "./personal-bests";

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
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
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>;
}

function BarChart({ rows }: { rows: { label: string; count: number }[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 truncate sm:w-32">{r.label}</span>
          <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-2 rounded-full bg-foreground/70"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StatsDashboard({
  speciesBreakdown,
  lakeBreakdown,
  fishingDays,
  personalBests,
  initialExpanded = null,
}: {
  speciesBreakdown: SpeciesBreakdownRow[];
  lakeBreakdown: LakeBreakdownRow[];
  fishingDays: FishingDayRow[];
  personalBests: PersonalBest[];
  initialExpanded?: "species" | null;
}) {
  const [view, setView] = useState<"overview" | "fishingdays">("overview");
  const [expanded, setExpanded] = useState<"species" | "lakes" | "fish" | null>(
    initialExpanded
  );

  const speciesCount = speciesBreakdown.length;
  const lakeCount = lakeBreakdown.length;
  const fishCount = speciesBreakdown.reduce((sum, s) => sum + s.count, 0);
  const fishingDaysCount = fishingDays.length;

  if (view === "fishingdays") {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <FishingDaysExplorer
          fishingDays={fishingDays}
          onBack={() => setView("overview")}
        />
      </div>
    );
  }

  // Both already ordered by count desc, highest first — straight from the query.
  const speciesRows = speciesBreakdown.map((s) => ({ label: s.species, count: s.count }));
  const lakeRows = lakeBreakdown.map((l) => ({ label: l.lake, count: l.count }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Antal arter"
          value={speciesCount}
          active={expanded === "species"}
          onClick={() => setExpanded(expanded === "species" ? null : "species")}
        />
        <StatCard
          label="Antal sjöar"
          value={lakeCount}
          active={expanded === "lakes"}
          onClick={() => setExpanded(expanded === "lakes" ? null : "lakes")}
        />
        <StatCard
          label="Antal fiskedagar"
          value={fishingDaysCount}
          onClick={() => setView("fishingdays")}
        />
        <StatCard
          label="Antal fiskar"
          value={fishCount}
          active={expanded === "fish"}
          onClick={() => setExpanded(expanded === "fish" ? null : "fish")}
        />
      </div>

      {expanded === "species" && (
        <div className="flex flex-col gap-6 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <div>
            <h2 className="text-lg font-semibold">Alla arter</h2>
            {speciesRows.length === 0 ? (
              <Empty>Inga fångster loggade än.</Empty>
            ) : (
              <BarChart rows={speciesRows} />
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Personbästa</h2>
            <div className="mt-3">
              <PersonalBests bests={personalBests} />
            </div>
          </div>
        </div>
      )}

      {expanded === "lakes" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Alla sjöar</h2>
          {lakeRows.length === 0 ? (
            <Empty>Ingen sjö har fyllts i på några fångster än.</Empty>
          ) : (
            <BarChart rows={lakeRows} />
          )}
        </div>
      )}

      {expanded === "fish" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Fördelning per art</h2>
          {speciesRows.length === 0 ? (
            <Empty>Inga fångster loggade än.</Empty>
          ) : (
            <BarChart rows={speciesRows} />
          )}
        </div>
      )}
    </div>
  );
}
