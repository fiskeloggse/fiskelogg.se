"use client";

import { useState } from "react";
import type { Catch } from "./catch-list";

type FieldKey = "species" | "matt" | "vatten" | "datum" | "vader" | "manfas" | "pb";

function buildFields(item: Catch, isPersonalBest: boolean) {
  return [
    { key: "species" as const, label: "Art", applicable: true },
    {
      key: "matt" as const,
      label: "Mått",
      applicable: item.length_cm != null || item.weight_kg != null,
    },
    { key: "vatten" as const, label: "Vatten", applicable: Boolean(item.lake) },
    { key: "datum" as const, label: "Datum", applicable: true },
    {
      key: "vader" as const,
      label: "Väder",
      applicable: Boolean(item.weather_description),
    },
    { key: "manfas" as const, label: "Månfas", applicable: true },
    { key: "pb" as const, label: "🏆 Personbästa-badge", applicable: isPersonalBest },
  ].filter((f) => f.applicable);
}

export default function ShareCardPanel({
  item,
  isPersonalBest,
}: {
  item: Catch;
  isPersonalBest: boolean;
}) {
  const fields = buildFields(item, isPersonalBest);
  const [selected, setSelected] = useState<Record<FieldKey, boolean>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, true])) as Record<FieldKey, boolean>
  );

  const params = new URLSearchParams();
  for (const f of fields) {
    params.set(f.key, selected[f.key] ? "1" : "0");
  }
  const cardUrl = `/register/${item.id}/card?${params.toString()}`;

  return (
    <details className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5">
      <summary className="cursor-pointer text-sm font-semibold">
        Dela kort
      </summary>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {fields.map((f) => (
            <label key={f.key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={selected[f.key]}
                onChange={(e) =>
                  setSelected((prev) => ({ ...prev, [f.key]: e.target.checked }))
                }
              />
              {f.label}
            </label>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element -- server-generated PNG, changes with the checkboxes above */}
          <img
            key={cardUrl}
            src={cardUrl}
            alt="Förhandsgranskning av delningskort"
            className="w-full max-w-xs"
          />
        </div>

        <a
          href={cardUrl}
          download={`fisklogg-fangst-${item.id}.png`}
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Ladda ner kort
        </a>
      </div>
    </details>
  );
}
