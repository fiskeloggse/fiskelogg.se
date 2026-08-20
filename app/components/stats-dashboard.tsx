"use client";

import { useState } from "react";
import type { FishingDayRow, LakeBreakdownRow, SpeciesBreakdownRow } from "@/lib/stats";
import FishingDaysExplorer from "./fishing-days-explorer";

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

export default function StatsDashboard({
  speciesBreakdown,
  lakeBreakdown,
  fishingDays,
}: {
  speciesBreakdown: SpeciesBreakdownRow[];
  lakeBreakdown: LakeBreakdownRow[];
  fishingDays: FishingDayRow[];
}) {
  const [view, setView] = useState<"overview" | "fishingdays">("overview");
  const [expanded, setExpanded] = useState<"species" | "lakes" | "fish" | null>(
    null
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

  const maxFish = Math.max(1, ...speciesBreakdown.map((s) => s.count));

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
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Alla arter</h2>
          {speciesBreakdown.length === 0 ? (
            <Empty>Inga fångster loggade än.</Empty>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {[...speciesBreakdown]
                .sort((a, b) => a.species.localeCompare(b.species, "sv"))
                .map((s) => (
                  <li
                    key={s.species}
                    className="rounded-full border border-black/10 px-3 py-1 dark:border-white/15"
                  >
                    {s.species}{" "}
                    <span className="text-zinc-400 dark:text-zinc-500">
                      · {s.count}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {expanded === "lakes" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Alla sjöar</h2>
          {lakeBreakdown.length === 0 ? (
            <Empty>Ingen sjö har fyllts i på några fångster än.</Empty>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {[...lakeBreakdown]
                .sort((a, b) => a.lake.localeCompare(b.lake, "sv"))
                .map((l) => (
                  <li
                    key={l.lake}
                    className="rounded-full border border-black/10 px-3 py-1 dark:border-white/15"
                  >
                    {l.lake}{" "}
                    <span className="text-zinc-400 dark:text-zinc-500">
                      · {l.count}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {expanded === "fish" && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Fördelning per art</h2>
          {speciesBreakdown.length === 0 ? (
            <Empty>Inga fångster loggade än.</Empty>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {speciesBreakdown.map((s) => (
                <div key={s.species} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 truncate sm:w-32">
                    {s.species}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-2 rounded-full bg-foreground/70"
                      style={{ width: `${(s.count / maxFish) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
