"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteCatch } from "@/app/actions/catches";
import ConfirmDeleteButton from "./confirm-delete-button";
import EditCatchForm from "./edit-catch-form";
import CatchesMap from "./catches-map";
import ShareCardPanel from "./share-card-panel";
import type { Catch } from "./catch-list";
import { windDirLabel } from "@/lib/constants";
import { getMoonPhase } from "@/lib/moon-phase";

function formatDateFull(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "full", timeStyle: "short" });
}

export default function CatchDetail({
  item,
  isPersonalBest,
}: {
  item: Catch;
  isPersonalBest: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(false);

  // Query params carry the Register filters/sort that were active when the
  // user clicked into this catch, so navigating back restores them.
  const query = searchParams.toString();
  const backHref = `/register${query ? `?${query}` : ""}`;
  const moonPhase = getMoonPhase(item.caught_at);

  async function handleDelete(formData: FormData) {
    await deleteCatch(formData);
    router.push(backHref);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href={backHref}
          className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
        >
          ← Tillbaka till Register
        </Link>
        <EditCatchForm item={item} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
      >
        ← Tillbaka till Register
      </Link>

      <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-2xl font-semibold">{item.species || "Okänd art"}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDateFull(item.caught_at)}
          {item.angler_name && ` · ${item.angler_name}`}
        </p>

        {item.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element -- externally hosted blob URL, not a local/optimizable asset
          <img
            src={item.photo_url}
            alt={item.species ?? "Fångst"}
            className="mt-4 max-h-96 w-full rounded-lg object-cover"
          />
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">Längd</p>
            <p className="text-lg font-medium">
              {item.length_cm != null ? `${item.length_cm} cm` : "–"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">Vikt</p>
            <p className="text-lg font-medium">
              {item.weight_kg != null ? `${item.weight_kg} kg` : "–"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Vatten</p>
            <p className="text-lg font-medium">{item.lake || "–"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Plats</p>
            <p className="text-lg font-medium">{item.location || "–"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Fiskemetod</p>
            <p className="text-lg font-medium">{item.method || "–"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Bete</p>
            <p className="text-lg font-medium">{item.bait || "–"}</p>
          </div>
          {item.comment && (
            <div className="col-span-2">
              <p className="text-zinc-500 dark:text-zinc-400">Kommentar</p>
              <p className="text-lg font-medium whitespace-pre-wrap">
                {item.comment}
              </p>
            </div>
          )}
          {item.weather_description && (
            <div className="col-span-2">
              <p className="text-zinc-500 dark:text-zinc-400">Väder</p>
              <p className="text-lg font-medium">
                {item.weather_description}
                {item.weather_temp_c != null && `, ${Math.round(item.weather_temp_c)}°`}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {[
                  item.weather_wind_kmh != null &&
                    `${Math.round(item.weather_wind_kmh / 3.6)} m/s${
                      item.weather_wind_dir_deg != null
                        ? ` ${windDirLabel(item.weather_wind_dir_deg)}`
                        : ""
                    }`,
                  item.weather_pressure_hpa != null &&
                    `${Math.round(item.weather_pressure_hpa)} hPa`,
                  item.weather_cloud_pct != null && `${Math.round(item.weather_cloud_pct)}% moln`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Månfas</p>
            <p className="text-lg font-medium">
              {moonPhase.icon} {moonPhase.label}
            </p>
          </div>
        </div>

        {item.latitude != null && item.longitude != null && (
          <div className="mt-5">
            <p className="mb-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Position
            </p>
            <CatchesMap
              catches={[
                {
                  id: item.id,
                  species: item.species,
                  length_cm: item.length_cm,
                  weight_kg: item.weight_kg,
                  caught_at: item.caught_at,
                  latitude: item.latitude,
                  longitude: item.longitude,
                },
              ]}
            />
          </div>
        )}

        <div className="mt-6">
          <ShareCardPanel item={item} isPersonalBest={isPersonalBest} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Redigera
          </button>
          <ConfirmDeleteButton
            action={handleDelete}
            id={item.id}
            label="Ta bort fångst"
          />
        </div>
      </div>
    </div>
  );
}
