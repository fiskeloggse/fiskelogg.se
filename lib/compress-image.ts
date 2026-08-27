// Client-only — relies on canvas/createImageBitmap, which don't exist
// server-side. Only ever import this from "use client" components.

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

// Downscales and re-encodes an image in the browser before it's uploaded,
// so a multi-MB phone photo (often 3–8 MB) shrinks to roughly 100–300 KB —
// still well above Instagram's own 1080px upload standard, but a fraction
// of the storage cost. Falls back to the original file whenever any step
// fails (e.g. a format the browser's canvas can't decode, like HEIC on some
// desktop browsers) — the server enforces its own size/type limit either way.
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Swaps a compressed File into a file input's FileList so the eventual form
// submit sends it instead of the original — the input element is still the
// single source of truth for what gets uploaded.
export function replaceInputFile(input: HTMLInputElement, file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
}
