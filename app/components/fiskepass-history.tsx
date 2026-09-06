"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateFiskepass, deleteFiskepass, fetchFiskepassCatches } from "@/app/actions/fiskepass";
import type { FiskepassWithCatchCount } from "@/lib/fiskepass";
import type { Catch } from "./catch-list";
import type { MappedCatchRow } from "@/lib/stats";
import { WEATHER_DESCRIPTION_ICONS } from "@/lib/constants";
import { getMoonPhase } from "@/lib/moon-phase";
import ConfirmDeleteButton from "./confirm-delete-button";
import WatersMap from "./waters-map";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatSv(n: number): string {
  return roundTo2(n).toString().replace(".", ",");
}

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

// Same shape WatersMap groups by lake -- only catches with both a position
// and a named water can be placed on it.
function toMappedCatches(catches: Catch[]): MappedCatchRow[] {
  return catches
    .filter(
      (c): c is Catch & { latitude: number; longitude: number; lake: string } =>
        c.latitude != null && c.longitude != null && !!c.lake
    )
    .map((c) => ({
      id: c.id,
      species: c.species,
      length_cm: c.length_cm,
      weight_kg: c.weight_kg,
      caught_at: c.caught_at,
      latitude: c.latitude,
      longitude: c.longitude,
      lake: c.lake,
    }));
}

function PassCatchList({ catches, isTeam }: { catches: Catch[]; isTeam: boolean }) {
  const router = useRouter();

  if (catches.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
        Inga fångster i detta pass.
      </p>
    );
  }

  const mappedCatches = toMappedCatches(catches);

  return (
    <div className="flex flex-col gap-3 p-3">
      {mappedCatches.length > 0 && (
        <WatersMap catches={mappedCatches} alwaysExpanded />
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <th className="px-2 py-1.5 font-medium">Datum</th>
              <th className="px-2 py-1.5 font-medium">Art</th>
              <th className="px-2 py-1.5 font-medium">Plats</th>
              <th className="w-px px-2 py-1.5 text-right font-medium whitespace-nowrap">
                Mått
              </th>
              <th className="px-2 py-1.5 font-medium">Metod/Bete</th>
              <th className="px-2 py-1.5 font-medium">Väder</th>
              <th className="px-2 py-1.5 font-medium">Månfas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {catches.map((item) => {
              const moonPhase = getMoonPhase(item.caught_at);
              return (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/register/${item.id}`)}
                  className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatDate(item.caught_at)}</td>
                  <td className="px-2 py-1.5">
                    {item.species || "Okänd art"}
                    {isTeam && item.angler_name && (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {" "}
                        · {item.angler_name}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">
                    {item.lake || item.location ? (
                      <div className="flex items-start gap-1.5">
                        {item.latitude != null && item.longitude != null && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                          >
                            <title>GPS-position sparad</title>
                            <path d="M12 21s-7-6.05-7-11a7 7 0 0 1 14 0c0 4.95-7 11-7 11Z" />
                            <circle cx="12" cy="10" r="2.25" />
                          </svg>
                        )}
                        <span>{item.lake || item.location}</span>
                      </div>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    {item.length_cm != null ? `${item.length_cm} cm` : "–"}
                    <br />
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {item.weight_kg != null ? `${formatSv(item.weight_kg)} kg` : "–"}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-zinc-500 dark:text-zinc-400">
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
                  <td className="px-2 py-1.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {item.weather_description ? (
                      <>
                        <span title={item.weather_description}>
                          {WEATHER_DESCRIPTION_ICONS[item.weather_description] ??
                            item.weather_description}
                        </span>
                        {item.weather_temp_c != null &&
                          ` ${Math.round(item.weather_temp_c)}°`}
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center text-lg" title={moonPhase.label}>
                    {moonPhase.icon}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function toDatetimeLocalValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function formatDateTime(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

function FiskepassRow({ pass }: { pass: FiskepassWithCatchCount }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateFiskepass, undefined);
  const [startLocal, setStartLocal] = useState(toDatetimeLocalValue(pass.start_time));
  const [stopLocal, setStopLocal] = useState(
    pass.stop_time ? toDatetimeLocalValue(pass.stop_time) : ""
  );
  const [catches, setCatches] = useState<Catch[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    if (!e.currentTarget.open || catches !== null || loading) return;
    setLoading(true);
    const data = await fetchFiskepassCatches(pass.id);
    setCatches(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state && "success" in state) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <li className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={pass.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Start</label>
              <input
                type="datetime-local"
                required
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className={inputClassName}
              />
              <input
                type="hidden"
                name="startTime"
                value={startLocal ? new Date(startLocal).toISOString() : ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Stopp</label>
              <input
                type="datetime-local"
                value={stopLocal}
                onChange={(e) => setStopLocal(e.target.value)}
                className={inputClassName}
              />
              <input
                type="hidden"
                name="stopTime"
                value={stopLocal ? new Date(stopLocal).toISOString() : ""}
              />
            </div>
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {pending ? "Sparar…" : "Spara"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li>
      <details
        name="fiskepass-row"
        className="rounded-xl border border-black/10 dark:border-white/15"
        onToggle={handleToggle}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">
              {formatDateTime(pass.start_time)}
              {pass.stop_time ? ` – ${formatDateTime(pass.stop_time)}` : " – pågår"}
              <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
                {pass.team_id ? "Team" : "Ensam"}
              </span>
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              {pass.target_species && pass.target_species.length > 0
                ? pass.target_species.join(", ") + " · "
                : ""}
              {pass.catch_count} {pass.catch_count === 1 ? "fångst" : "fångster"}
              {pass.catch_count === 0 && pass.stop_time && " · Bompass"}
            </p>
          </div>
          {/* Stops the click from also toggling the <details> open/closed --
              editing or deleting shouldn't require expanding the row first. */}
          <span
            onClick={(e) => e.preventDefault()}
            className="flex shrink-0 items-center gap-3"
          >
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
            >
              Redigera
            </button>
            <ConfirmDeleteButton action={deleteFiskepass} id={pass.id} compact />
          </span>
        </summary>

        <div className="border-t border-black/10 dark:border-white/15">
          {loading ? (
            <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Laddar…
            </p>
          ) : (
            catches && <PassCatchList catches={catches} isTeam={pass.team_id != null} />
          )}
        </div>
      </details>
    </li>
  );
}

export default function FiskepassHistory({
  history,
}: {
  history: FiskepassWithCatchCount[];
}) {
  if (history.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Inga fiskepass loggade än.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((pass) => (
        <FiskepassRow key={pass.id} pass={pass} />
      ))}
    </ul>
  );
}
