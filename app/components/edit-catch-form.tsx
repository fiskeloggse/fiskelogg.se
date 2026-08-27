"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateCatch, type EditCatchState } from "@/app/actions/catches";
import { lookupWaterName } from "@/app/actions/geocode";
import { compressImage, replaceInputFile } from "@/lib/compress-image";
import { FISH_SPECIES } from "@/lib/species";
import type { Catch } from "./catch-list";
import MapPositionPicker from "./map-position-picker";
import TextSuggestInput from "./text-suggest-input";

const inputClassName =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent";

function toDatetimeLocalValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function toDatetimeLocalMax() {
  return toDatetimeLocalValue(new Date());
}

export default function EditCatchForm({
  item,
  onClose,
}: {
  item: Catch;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<EditCatchState, FormData>(
    updateCatch,
    undefined
  );

  const errorMessage = state && "error" in state ? state.error : undefined;
  const succeeded = state && "success" in state;

  const [species, setSpecies] = useState(item.species ?? "");
  const [caughtAtLocal, setCaughtAtLocal] = useState(
    toDatetimeLocalValue(item.caught_at)
  );
  const [showMap, setShowMap] = useState(false);
  const [latitude, setLatitude] = useState(item.latitude ?? null);
  const [longitude, setLongitude] = useState(item.longitude ?? null);
  const hasPosition = latitude != null && longitude != null;
  const lakeInputRef = useRef<HTMLInputElement>(null);
  const [waterAutoFilled, setWaterAutoFilled] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const createdObjectUrlRef = useRef<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(item.photo_url ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [compressingPhoto, setCompressingPhoto] = useState(false);

  useEffect(() => {
    if (succeeded) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [succeeded]);

  useEffect(() => {
    return () => {
      if (createdObjectUrlRef.current) URL.revokeObjectURL(createdObjectUrlRef.current);
    };
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (createdObjectUrlRef.current) URL.revokeObjectURL(createdObjectUrlRef.current);
    if (!file) {
      createdObjectUrlRef.current = null;
      setPhotoPreview(item.photo_url ?? null);
      return;
    }
    setCompressingPhoto(true);
    const compressed = await compressImage(file);
    replaceInputFile(input, compressed);
    setCompressingPhoto(false);
    const url = URL.createObjectURL(compressed);
    createdObjectUrlRef.current = url;
    setPhotoPreview(url);
    setRemovePhoto(false);
  }

  function handleRemovePhoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (createdObjectUrlRef.current) {
      URL.revokeObjectURL(createdObjectUrlRef.current);
      createdObjectUrlRef.current = null;
    }
    setPhotoPreview(null);
    setRemovePhoto(true);
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5"
    >
      <input type="hidden" name="id" value={item.id} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Redigera fångst</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`species-${item.id}`} className="text-sm font-medium">
          Art
        </label>
        <TextSuggestInput
          id={`species-${item.id}`}
          name="species"
          value={species}
          onChange={setSpecies}
          options={FISH_SPECIES}
          required
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Foto</span>
        <div className="flex items-center gap-3">
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element -- object URL preview or an already-uploaded blob URL, neither worth next/image
            <img
              src={photoPreview}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg border border-black/10 object-cover dark:border-white/15"
            />
          )}
          <div className="flex flex-col items-start gap-1.5">
            <input
              ref={photoInputRef}
              id={`photo-${item.id}`}
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
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
                onClick={handleRemovePhoto}
                className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
              >
                Ta bort bild
              </button>
            )}
          </div>
        </div>
        <input type="hidden" name="removePhoto" value={removePhoto ? "on" : ""} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`lengthCm-${item.id}`} className="text-sm font-medium">
            Längd (cm)
          </label>
          <input
            id={`lengthCm-${item.id}`}
            name="lengthCm"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            defaultValue={item.length_cm ?? ""}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`weightKg-${item.id}`} className="text-sm font-medium">
            Vikt (kg)
          </label>
          <input
            id={`weightKg-${item.id}`}
            name="weightKg"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={item.weight_kg ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`lake-${item.id}`} className="text-sm font-medium">
            Vatten
          </label>
          <input
            ref={lakeInputRef}
            id={`lake-${item.id}`}
            name="lake"
            type="text"
            defaultValue={item.lake ?? ""}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`location-${item.id}`} className="text-sm font-medium">
            Plats
          </label>
          <input
            id={`location-${item.id}`}
            name="location"
            type="text"
            defaultValue={item.location ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`method-${item.id}`} className="text-sm font-medium">
            Fiskemetod
          </label>
          <input
            id={`method-${item.id}`}
            name="method"
            type="text"
            defaultValue={item.method ?? ""}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`bait-${item.id}`} className="text-sm font-medium">
            Bete
          </label>
          <input
            id={`bait-${item.id}`}
            name="bait"
            type="text"
            defaultValue={item.bait ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`comment-${item.id}`} className="text-sm font-medium">
          Kommentar
        </label>
        <textarea
          id={`comment-${item.id}`}
          name="comment"
          rows={2}
          defaultValue={item.comment ?? ""}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Position</span>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
          >
            {showMap ? "Dölj karta" : hasPosition ? "Ändra position" : "Lägg till position"}
          </button>
        </div>
        {hasPosition && !showMap && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Position sparad.{" "}
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Visa på karta
            </a>
          </p>
        )}
        {showMap && (
          <MapPositionPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
              const lakeInput = lakeInputRef.current;
              if (lakeInput && lakeInput.value.trim() === "") {
                lookupWaterName(lat, lng).then((name) => {
                  if (name && lakeInput.value.trim() === "") {
                    lakeInput.value = name;
                    setWaterAutoFilled(true);
                  }
                });
              }
            }}
          />
        )}
        {waterAutoFilled && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ✓ Vatten ifyllt automatiskt.
          </p>
        )}
        {hasPosition && (
          <>
            <input type="hidden" name="latitude" value={latitude} />
            <input type="hidden" name="longitude" value={longitude} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`caughtAt-${item.id}`} className="text-sm font-medium">
          Fångstdatum och tid
        </label>
        <input
          id={`caughtAt-${item.id}`}
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

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || compressingPhoto}
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Spara"}
      </button>
    </form>
  );
}
