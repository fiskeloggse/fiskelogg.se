"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";

export default function PhotoField({
  idSuffix,
  initialUrl = null,
  className,
}: {
  idSuffix?: string;
  initialUrl?: string | null;
  className?: string;
}) {
  const inputId = idSuffix ? `photo-${idSuffix}` : "photo";
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [removed, setRemoved] = useState(false);
  const [compressing, setCompressing] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      const dt = new DataTransfer();
      dt.items.add(compressed);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setPreview(URL.createObjectURL(file));
    } finally {
      setRemoved(false);
      setCompressing(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className ?? "flex flex-col gap-1.5"}>
      <label htmlFor={inputId} className="text-sm font-medium">
        Bild <span className="font-normal text-zinc-500">(valfritt)</span>
      </label>

      {preview && (
        <div className="relative w-28">
          {/* eslint-disable-next-line @next/next/no-img-element -- object-fit thumbnail of an uploaded/blob-preview photo, not an optimizable static asset */}
          <img
            src={preview}
            alt=""
            className="h-28 w-28 rounded-lg border border-black/10 object-cover dark:border-white/15"
          />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Ta bort bild"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-sm text-background"
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        name="photo"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="text-sm"
      />

      {compressing && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Bearbetar bild…
        </p>
      )}

      {removed && <input type="hidden" name="removePhoto" value="true" />}
    </div>
  );
}
