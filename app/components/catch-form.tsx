"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addCatch, type CatchNotices } from "@/app/actions/catches";
import { FISH_SPECIES } from "@/lib/species";
import type { SpeciesSuggestions } from "@/lib/species-suggestions";
import type { BaitSuggestions } from "@/lib/bait-suggestions";
import { QUICK_LOG_FIELD_KEYS } from "@/lib/constants";
import ImportCatchesForm from "./import-catches-form";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function Chips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      {options.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={
            "rounded-full border px-3 py-1 text-sm transition-colors " +
            (selected === s
              ? "border-foreground bg-foreground text-background"
              : "border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10")
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function personalBestText(pb: NonNullable<CatchNotices["personalBest"]>) {
  if (pb.isLongest && pb.isHeaviest) {
    return `${pb.lengthCm} cm & ${pb.weightKg} kg ${pb.species}`;
  }
  if (pb.isLongest) {
    return `${pb.lengthCm} cm ${pb.species}`;
  }
  return `${pb.weightKg} kg ${pb.species}`;
}

function toDatetimeLocalMax() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export default function CatchForm({
  suggestions,
  baitSuggestions,
  currentUserId,
  currentUserName,
  teamMembers,
  defaultLake,
  defaultBait,
  quickLogFields,
  gpsDefaultEnabled,
}: {
  suggestions: SpeciesSuggestions;
  baitSuggestions: BaitSuggestions;
  currentUserId: number;
  currentUserName: string;
  teamMembers: { id: number; name: string }[];
  defaultLake: string | null;
  defaultBait: string | null;
  quickLogFields: string[] | null;
  gpsDefaultEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(addCatch, undefined);
  const wasPending = useRef(false);
  const [mode, setMode] = useState<"closed" | "now" | "past" | "import">(
    "closed"
  );
  const [showMore, setShowMore] = useState(false);

  const quickFields = quickLogFields ?? QUICK_LOG_FIELD_KEYS;
  const showWeight = quickFields.includes("weightKg");
  const showLake = quickFields.includes("lake");
  const showLocation = quickFields.includes("location");
  const showBait = quickFields.includes("bait");
  const showAngler = quickFields.includes("anglerId");
  const showComment = quickFields.includes("comment");
  const hasHiddenFields =
    !showWeight ||
    !showLake ||
    !showLocation ||
    !showBait ||
    !showComment ||
    (teamMembers.length > 0 && !showAngler);
  const [bingoNotice, setBingoNotice] = useState<
    CatchNotices["bingoMatch"] | null
  >(null);
  const [personalBestNotice, setPersonalBestNotice] = useState<
    CatchNotices["personalBest"] | null
  >(null);

  // Controlled so field values survive a failed submission — React resets
  // uncontrolled fields after every form action, success or not.
  const [anglerId, setAnglerId] = useState(String(currentUserId));
  const [species, setSpecies] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [lake, setLake] = useState(defaultLake ?? "");
  const [location, setLocation] = useState("");
  const [bait, setBait] = useState(defaultBait ?? "");
  const [comment, setComment] = useState("");
  const [caughtAtLocal, setCaughtAtLocal] = useState("");
  const [useGps, setUseGps] = useState(gpsDefaultEnabled);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const errorMessage = state && "error" in state ? state.error : undefined;

  useEffect(() => {
    if (!useGps || mode !== "now" || gpsCoords || gpsStatus === "loading") return;
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGps, mode]);

  useEffect(() => {
    if (wasPending.current && !pending && !errorMessage) {
      setSpecies("");
      setLengthCm("");
      setWeightKg("");
      setLocation("");
      setComment("");
      setCaughtAtLocal("");
      if (state && "bingoMatch" in state && state.bingoMatch) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBingoNotice(state.bingoMatch);
      }
      if (state && "personalBest" in state && state.personalBest) {
        setPersonalBestNotice(state.personalBest);
      }
    }
    wasPending.current = pending;
  }, [pending, state, errorMessage]);

  useEffect(() => {
    if (!bingoNotice) return;
    const timer = setTimeout(() => setBingoNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [bingoNotice]);

  useEffect(() => {
    if (!personalBestNotice) return;
    const timer = setTimeout(() => setPersonalBestNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [personalBestNotice]);

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm flex-col gap-2">
        {bingoNotice && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/15 dark:bg-zinc-900">
            <p className="text-sm">
              🎯 Bingo! {bingoNotice.cm} cm {bingoNotice.species} bockade av en
              ruta.{" "}
              <Link href="/challenges" className="underline">
                Visa bingobricka
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setBingoNotice(null)}
              aria-label="Stäng"
              className="text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              ×
            </button>
          </div>
        )}

        {personalBestNotice && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/15 dark:bg-zinc-900">
            <p className="text-sm">
              🏆 Nytt personbästa! {personalBestText(personalBestNotice)}.{" "}
              <Link href="/statistik?expand=species" className="underline">
                Visa personbästa
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setPersonalBestNotice(null)}
              aria-label="Stäng"
              className="text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {mode === "closed" ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("now")}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            + Logga fångst
          </button>
          <button
            type="button"
            onClick={() => setMode("past")}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            + Logga tidigare fångst
          </button>
          <button
            type="button"
            onClick={() => setMode("import")}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            + Importera från Excel
          </button>
        </div>
      ) : mode === "import" ? (
        <ImportCatchesForm onClose={() => setMode("closed")} />
      ) : (
        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === "past" ? "Logga en tidigare fångst" : "Logga en fångst"}
            </h2>
            <button
              type="button"
              onClick={() => setMode("closed")}
              className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>

          {teamMembers.length > 0 && (
            <div className={showAngler || showMore ? "flex flex-col gap-1.5" : "hidden"}>
              <label htmlFor="anglerId" className="text-sm font-medium">
                Fiskare
              </label>
              <select
                id="anglerId"
                name="anglerId"
                value={anglerId}
                onChange={(e) => setAnglerId(e.target.value)}
                className={inputClassName}
              >
                <option value={currentUserId}>{currentUserName} (du)</option>
                {teamMembers
                  .filter((m) => m.id !== currentUserId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="species" className="text-sm font-medium">
              Art
            </label>

            <Chips
              label="Senaste"
              options={suggestions.recent}
              selected={species}
              onSelect={setSpecies}
            />
            <Chips
              label="Vanliga"
              options={suggestions.common}
              selected={species}
              onSelect={setSpecies}
            />

            <input
              id="species"
              name="species"
              type="text"
              list="species-catalog"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              required
              autoComplete="off"
              placeholder="Sök art eller skriv eget namn"
              className={inputClassName}
            />
            <datalist id="species-catalog">
              {FISH_SPECIES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lengthCm" className="text-sm font-medium">
              Längd (cm){" "}
              <span className="font-normal text-zinc-500">(valfritt)</span>
            </label>
            <input
              id="lengthCm"
              name="lengthCm"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className={showWeight || showMore ? "flex flex-col gap-1.5" : "hidden"}>
            <label htmlFor="weightKg" className="text-sm font-medium">
              Vikt (kg){" "}
              <span className="font-normal text-zinc-500">(valfritt)</span>
            </label>
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className={showLake || showMore ? "flex flex-col gap-1.5" : "hidden"}>
            <label htmlFor="lake" className="text-sm font-medium">
              Sjö <span className="font-normal text-zinc-500">(valfritt)</span>
            </label>
            <input
              id="lake"
              name="lake"
              type="text"
              value={lake}
              onChange={(e) => setLake(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className={showLocation || showMore ? "flex flex-col gap-1.5" : "hidden"}>
            <label htmlFor="location" className="text-sm font-medium">
              Plats{" "}
              <span className="font-normal text-zinc-500">(valfritt)</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className={showBait || showMore ? "flex flex-col gap-2" : "hidden"}>
            <label htmlFor="bait" className="text-sm font-medium">
              Bete <span className="font-normal text-zinc-500">(valfritt)</span>
            </label>

            <Chips
              label="Senaste"
              options={baitSuggestions.recent}
              selected={bait}
              onSelect={setBait}
            />
            <Chips
              label="Vanliga"
              options={baitSuggestions.common}
              selected={bait}
              onSelect={setBait}
            />

            <input
              id="bait"
              name="bait"
              type="text"
              list="bait-catalog"
              value={bait}
              onChange={(e) => setBait(e.target.value)}
              autoComplete="off"
              placeholder="Sök bete eller skriv eget namn"
              className={inputClassName}
            />
            <datalist id="bait-catalog">
              {baitSuggestions.all.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div className={showComment || showMore ? "flex flex-col gap-1.5" : "hidden"}>
            <label htmlFor="comment" className="text-sm font-medium">
              Kommentar{" "}
              <span className="font-normal text-zinc-500">(valfritt)</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={inputClassName}
            />
          </div>

          {hasHiddenFields && (
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
            >
              {showMore ? "Färre fält" : "Fler fält"}
            </button>
          )}

          {mode === "now" && (
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useGps}
                  onChange={(e) => {
                    setUseGps(e.target.checked);
                    if (!e.target.checked) {
                      setGpsCoords(null);
                      setGpsStatus("idle");
                    }
                  }}
                />
                Bifoga GPS-position
              </label>
              {gpsStatus === "loading" && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Hämtar position…
                </p>
              )}
              {gpsStatus === "success" && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  ✓ Position hämtad.
                </p>
              )}
              {gpsStatus === "error" && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Kunde inte hämta position. Fångsten loggas ändå.
                </p>
              )}
              {gpsCoords && (
                <>
                  <input type="hidden" name="latitude" value={gpsCoords.lat} />
                  <input type="hidden" name="longitude" value={gpsCoords.lng} />
                </>
              )}
            </div>
          )}

          {mode === "past" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="caughtAtLocal" className="text-sm font-medium">
                Fångstdatum och tid
              </label>
              <input
                id="caughtAtLocal"
                type="datetime-local"
                required
                max={toDatetimeLocalMax()}
                value={caughtAtLocal}
                onChange={(e) => setCaughtAtLocal(e.target.value)}
                className={inputClassName}
              />
              <input
                type="hidden"
                name="caughtAt"
                value={caughtAtLocal ? new Date(caughtAtLocal).toISOString() : ""}
              />
            </div>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ange minst en av längd eller vikt.{" "}
            {mode === "past"
              ? "Välj datum och tid för fångsten ovan."
              : "Tidpunkten sätts automatiskt till nu."}
          </p>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? "Loggar…" : "Logga fångst"}
          </button>
        </form>
      )}
    </>
  );
}
