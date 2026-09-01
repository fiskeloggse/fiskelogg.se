"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addCatch, updateCatchLake, type CatchNotices } from "@/app/actions/catches";
import { lookupWaterName } from "@/app/actions/geocode";
import { FISH_SPECIES } from "@/lib/species";
import type { SpeciesSuggestions } from "@/lib/species-suggestions";
import type { BaitSuggestions } from "@/lib/bait-suggestions";
import type { LakeSuggestions } from "@/lib/lake-suggestions";
import type { LocationSuggestions } from "@/lib/location-suggestions";
import type { MethodSuggestions } from "@/lib/method-suggestions";
import { QUICK_LOG_FIELD_KEYS, type GpsModeKey } from "@/lib/constants";
import { compressImage, replaceInputFile } from "@/lib/compress-image";
import TextSuggestInput from "./text-suggest-input";
import MapPositionPicker from "./map-position-picker";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function Chips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  // Always takes up the same height as a row with a chip in it, even with
  // zero options — otherwise a field with no recent suggestion yet sits
  // shorter than its paired field that has one (e.g. Fiskemetod vs. Bete
  // when only Bete has history), throwing the two out of alignment.
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1.5">
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/15">
      <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Renders a section's blocks with the ones shown by default first and the
// "Fler fält"-only ones appended below — instead of interleaved in their
// fixed structural position — so revealing extra fields never pushes them
// in above what's already visible. Array.prototype.sort is stable, so each
// group keeps its own relative order.
function OrderedFields({
  blocks,
  showMore,
}: {
  blocks: { key: string; show: boolean; content: React.ReactNode }[];
  showMore: boolean;
}) {
  const ordered = blocks
    .filter((b) => b.show || showMore)
    .sort((a, b) => Number(b.show) - Number(a.show));

  return (
    <>
      {ordered.map((b) => (
        <div key={b.key}>{b.content}</div>
      ))}
    </>
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
  lakeSuggestions,
  locationSuggestions,
  methodSuggestions,
  currentUserId,
  currentUserName,
  teamMembers,
  defaultLake,
  defaultBait,
  defaultMethod,
  quickLogFields,
  gpsMode,
}: {
  suggestions: SpeciesSuggestions;
  baitSuggestions: BaitSuggestions;
  lakeSuggestions: LakeSuggestions;
  locationSuggestions: LocationSuggestions;
  methodSuggestions: MethodSuggestions;
  currentUserId: number;
  currentUserName: string;
  teamMembers: { id: number; name: string }[];
  defaultLake: string | null;
  defaultBait: string | null;
  defaultMethod: string | null;
  quickLogFields: string[] | null;
  gpsMode: GpsModeKey;
}) {
  const [state, formAction, pending] = useActionState(addCatch, undefined);
  const wasPending = useRef(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) {
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    setCompressingPhoto(true);
    const compressed = await compressImage(file);
    replaceInputFile(input, compressed);
    setCompressingPhoto(false);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(compressed);
    });
  }

  function clearPhoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }
  const [mode, setMode] = useState<"closed" | "now" | "past">("closed");
  const [showMore, setShowMore] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const shouldBeOpen = mode === "now" || mode === "past";
    if (shouldBeOpen && !dialog.open) dialog.showModal();
    if (!shouldBeOpen && dialog.open) dialog.close();

    // showModal() alone doesn't reliably stop the page behind it from
    // scrolling (notably on mobile touch-scroll), so lock it explicitly
    // while the dialog is open.
    if (shouldBeOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mode]);

  const quickFields = quickLogFields ?? QUICK_LOG_FIELD_KEYS;
  // Längd/Vikt, Vatten/Plats, and Fiskemetod/Bete are each toggled together
  // as one row in Snabbloggning, so the pair shares its representative
  // field's key (see the comment on QUICK_LOG_FIELDS).
  const showPhoto = quickFields.includes("photo");
  const showLength = quickFields.includes("weightKg");
  const showWeight = quickFields.includes("weightKg");
  const showLake = quickFields.includes("lake");
  const showBait = quickFields.includes("bait");
  const showAngler = quickFields.includes("anglerId");
  const showComment = quickFields.includes("comment");
  const showGps = quickFields.includes("gps");
  const hasHiddenFields =
    !showPhoto ||
    !showWeight ||
    !showLake ||
    !showBait ||
    !showComment ||
    !showGps ||
    (teamMembers.length > 0 && !showAngler);
  // Whether each section has anything to show at all — a section with every
  // field hidden shouldn't render just its heading.
  const showSizeSection = showWeight || showMore;
  const showDetailsSection =
    showBait ||
    showComment ||
    showMore ||
    (teamMembers.length > 0 && showAngler);
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
  const [method, setMethod] = useState(defaultMethod ?? "");
  const [bait, setBait] = useState(defaultBait ?? "");
  const [comment, setComment] = useState("");
  const [caughtAtLocal, setCaughtAtLocal] = useState("");
  const defaultLogPosition = gpsMode === "position" || gpsMode === "both";
  const defaultLogWeather = gpsMode === "weather" || gpsMode === "both";
  const [useGps, setUseGps] = useState(defaultLogPosition);
  const [logWeather, setLogWeather] = useState(defaultLogWeather);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lakeAutoFilled, setLakeAutoFilled] = useState(false);
  // Position is always offered for a past catch (there's no live GPS fix to
  // fall back on), so the Plats section stays visible in that mode even if
  // Vatten/Plats themselves are hidden.
  const showPlatsSection =
    mode === "past" ? true : showLake || showGps || showMore || lakeAutoFilled;
  const [waterLookupPending, setWaterLookupPending] = useState(false);
  // Logging a past catch has no live GPS fix to attach — let the user pin
  // the spot on a map instead.
  const [showPastMap, setShowPastMap] = useState(false);
  const [pastLatitude, setPastLatitude] = useState<number | null>(null);
  const [pastLongitude, setPastLongitude] = useState<number | null>(null);
  const pastHasPosition = pastLatitude != null && pastLongitude != null;

  // Without this, closing the dialog (cancel or a successful submit) left
  // the map/pin from that catch showing the next time "Logga tidigare
  // fisk" was opened — easy to mistake for a map bug when really it was
  // just stale state from the previous entry.
  useEffect(() => {
    if (mode === "closed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowPastMap(false);
      setPastLatitude(null);
      setPastLongitude(null);
    }
  }, [mode]);

  const errorMessage = state && "error" in state ? state.error : undefined;

  // Plats suggestions are scoped to whatever Vatten currently holds — once
  // a water is picked, only places logged with THAT water make sense.
  // With no water typed yet there's nothing to narrow by, so fall back to
  // everything.
  const locationOptions = lake.trim()
    ? (locationSuggestions.byLake[lake.trim()] ?? [])
    : Object.values(locationSuggestions.byLake).flat();

  // Kept in sync so the async water lookup below can read the live value
  // instead of a stale closure, and never clobber something typed in the
  // meantime.
  const lakeRef = useRef(lake);
  useEffect(() => {
    lakeRef.current = lake;
  }, [lake]);

  // Next.js dispatches Server Actions one at a time per client: if the
  // water lookup (a direct call, not a form) is in flight when "Logga
  // fångst" is clicked, the addCatch submission queues behind it — but its
  // FormData is snapshotted at click time, before the lookup can fill in
  // Vatten. So the queued submission goes out with the field still empty
  // even though it visually appears to fill in "right after". These two
  // refs detect that race: submissionStartedSinceLookupRef flips true the
  // instant a submission begins (pending flips true at click time, which
  // is also when the stale FormData snapshot is taken); if the lookup
  // resolves after that point, the name is stashed instead of applied
  // immediately, then patched onto the just-saved catch once its id is
  // known.
  const submissionStartedSinceLookupRef = useRef(false);
  const pendingWaterNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (pending) submissionStartedSinceLookupRef.current = true;
  }, [pending]);

  useEffect(() => {
    if ((!useGps && !logWeather) || mode !== "now" || gpsCoords || gpsStatus === "loading")
      return;
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });
        setGpsStatus("success");
        submissionStartedSinceLookupRef.current = false;
        setWaterLookupPending(true);
        lookupWaterName(lat, lng)
          .then((name) => {
            if (!name) return;
            if (submissionStartedSinceLookupRef.current) {
              // A submission already froze its FormData without this name —
              // apply it once that catch's id is known (see the effect
              // below), and still prefill the next catch's form now.
              pendingWaterNameRef.current = name;
            }
            if (lakeRef.current.trim() === "") {
              setLake(name);
              setLakeAutoFilled(true);
            }
          })
          .finally(() => setWaterLookupPending(false));
      },
      () => {
        setGpsStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGps, logWeather, mode]);

  useEffect(() => {
    if (wasPending.current && !pending && !errorMessage) {
      setSpecies("");
      setLengthCm("");
      setWeightKg("");
      setLocation("");
      setComment("");
      setCaughtAtLocal("");
      setMode("closed");
      clearPhoto();
      if (state && "insertedId" in state && pendingWaterNameRef.current) {
        updateCatchLake(state.insertedId, pendingWaterNameRef.current);
        pendingWaterNameRef.current = null;
      }
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
      <div className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm flex-col gap-2 sm:bottom-4">
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
              <Link href="/statistik?expand=personalbests" className="underline">
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

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode("now")}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Logga fisk
        </button>
        <button
          type="button"
          onClick={() => setMode("past")}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          + Logga tidigare fisk
        </button>
      </div>

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setMode("closed");
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setMode("closed");
        }}
        className="m-auto max-h-[90vh] w-[min(90vw,32rem)] overflow-y-auto rounded-xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/15 dark:bg-zinc-900"
      >
        <form
          action={formAction}
          className="flex flex-col gap-4 p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === "past" ? "Logga en tidigare fisk" : "Logga en fisk"}
            </h2>
            <button
              type="button"
              onClick={() => setMode("closed")}
              className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="species" className="text-sm font-medium">
              Art
            </label>

            <TextSuggestInput
              id="species"
              name="species"
              value={species}
              onChange={setSpecies}
              options={FISH_SPECIES}
              required
              placeholder="Sök art eller skriv eget namn"
              className={inputClassName}
            />

            <Chips options={suggestions.recent} selected={species} onSelect={setSpecies} />
          </div>

          <div className={showPhoto || showMore ? "flex flex-col gap-2" : "hidden"}>
            <span className="text-sm font-medium">Foto</span>
            <div className="flex items-center gap-3">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a remote/optimizable image
                <img
                  src={photoPreview}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg border border-black/10 object-cover dark:border-white/15"
                />
              )}
              <div className="flex flex-col items-start gap-1.5">
                <input
                  ref={photoInputRef}
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={compressingPhoto}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
                >
                  📷 {photoPreview ? "Byt foto" : "Lägg till foto"}
                </button>
                {compressingPhoto && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Bearbetar bild…
                  </p>
                )}
                {photoPreview && !compressingPhoto && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
                  >
                    Ta bort bild
                  </button>
                )}
              </div>
            </div>
          </div>

          {showPlatsSection && (
            <Section title="Plats">
              <OrderedFields
                showMore={showMore}
                blocks={[
                  {
                    key: "position",
                    show: mode === "now" ? showGps : true,
                    content:
                      mode === "now" ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={useGps}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setUseGps(checked);
                                  if (!checked && !logWeather) {
                                    setGpsCoords(null);
                                    setGpsStatus("idle");
                                    setLakeAutoFilled(false);
                                  }
                                }}
                              />
                              Logga position
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={logWeather}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setLogWeather(checked);
                                  if (!checked && !useGps) {
                                    setGpsCoords(null);
                                    setGpsStatus("idle");
                                    setLakeAutoFilled(false);
                                  }
                                }}
                              />
                              Logga väder
                            </label>
                          </div>
                          {gpsStatus === "loading" && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Hämtar position…
                            </p>
                          )}
                          {gpsStatus === "success" && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              ✓ Position hämtad.{" "}
                              {waterLookupPending
                                ? "Söker vatten…"
                                : lakeAutoFilled && "Vatten ifyllt automatiskt."}
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
                              <input
                                type="hidden"
                                name="logPosition"
                                value={useGps ? "on" : ""}
                              />
                              <input
                                type="hidden"
                                name="logWeather"
                                value={logWeather ? "on" : ""}
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Position</span>
                            <button
                              type="button"
                              onClick={() => setShowPastMap((v) => !v)}
                              className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
                            >
                              {showPastMap
                                ? "Dölj karta"
                                : pastHasPosition
                                  ? "Ändra position"
                                  : "Lägg till position"}
                            </button>
                          </div>
                          {showPastMap && (
                            <MapPositionPicker
                              latitude={pastLatitude}
                              longitude={pastLongitude}
                              onChange={(lat, lng) => {
                                setPastLatitude(lat);
                                setPastLongitude(lng);
                                if (lakeRef.current.trim() === "") {
                                  lookupWaterName(lat, lng).then((name) => {
                                    if (name && lakeRef.current.trim() === "") {
                                      setLake(name);
                                      setLakeAutoFilled(true);
                                    }
                                  });
                                }
                              }}
                            />
                          )}
                          {pastHasPosition && (
                            <>
                              <input type="hidden" name="latitude" value={pastLatitude} />
                              <input type="hidden" name="longitude" value={pastLongitude} />
                              <input type="hidden" name="logPosition" value="on" />
                              <input
                                type="hidden"
                                name="logWeather"
                                value={defaultLogWeather ? "on" : ""}
                              />
                            </>
                          )}
                        </div>
                      ),
                  },
                  {
                    key: "vattenplats",
                    show: showLake || lakeAutoFilled,
                    content: (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="lake" className="text-sm font-medium">
                            Vatten
                          </label>

                          <TextSuggestInput
                            id="lake"
                            name="lake"
                            value={lake}
                            onChange={setLake}
                            options={lakeSuggestions.all}
                            showAllWhenEmpty
                            className={inputClassName}
                          />

                          <Chips options={lakeSuggestions.recent} selected={lake} onSelect={setLake} />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label htmlFor="location" className="text-sm font-medium">
                            Plats
                          </label>

                          <TextSuggestInput
                            id="location"
                            name="location"
                            value={location}
                            onChange={setLocation}
                            options={locationOptions}
                            showAllWhenEmpty
                            className={inputClassName}
                          />

                          <Chips
                            options={locationSuggestions.recent}
                            selected={location}
                            onSelect={setLocation}
                          />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Section>
          )}

          {showSizeSection && (
            <Section title="Storlek">
              <div className="grid grid-cols-2 gap-3">
                <div className={showLength || showMore ? "flex flex-col gap-1.5" : "hidden"}>
                  <label htmlFor="lengthCm" className="text-sm font-medium">
                    Längd (cm)
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
                    Vikt (kg)
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
              </div>
            </Section>
          )}

          {showDetailsSection && (
            <Section title="Detaljer">
              <OrderedFields
                showMore={showMore}
                blocks={[
                  {
                    key: "methodbait",
                    show: showBait,
                    content: (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="method" className="text-sm font-medium">
                            Fiskemetod
                          </label>

                          <TextSuggestInput
                            id="method"
                            name="method"
                            value={method}
                            onChange={setMethod}
                            options={methodSuggestions.all}
                            className={inputClassName}
                          />

                          <Chips
                            options={methodSuggestions.recent}
                            selected={method}
                            onSelect={setMethod}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label htmlFor="bait" className="text-sm font-medium">
                            Bete
                          </label>

                          <TextSuggestInput
                            id="bait"
                            name="bait"
                            value={bait}
                            onChange={setBait}
                            options={baitSuggestions.all}
                            placeholder="Sök bete eller skriv eget namn"
                            className={inputClassName}
                          />

                          <Chips options={baitSuggestions.recent} selected={bait} onSelect={setBait} />
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "comment",
                    show: showComment,
                    content: (
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="comment" className="text-sm font-medium">
                          Kommentar
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
                    ),
                  },
                  ...(teamMembers.length > 0
                    ? [
                        {
                          key: "angler",
                          show: showAngler,
                          content: (
                            <div className="flex flex-col gap-1.5">
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
                                <option value={currentUserId}>
                                  {currentUserName} (du)
                                </option>
                                {teamMembers
                                  .filter((m) => m.id !== currentUserId)
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </Section>
          )}

          {hasHiddenFields && (
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
            >
              {showMore ? "Färre fält" : "Fler fält"}
            </button>
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
            disabled={pending || compressingPhoto}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? "Loggar…" : "Logga fisk"}
          </button>
        </form>
      </dialog>
    </>
  );
}
