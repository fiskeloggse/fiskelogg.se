import "server-only";
import { put, del } from "@vercel/blob";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function validatePhotoFile(file: File): string | null {
  if (file.size > MAX_PHOTO_BYTES) {
    return "Bilden är för stor (max 8 MB).";
  }
  if (file.type && !ALLOWED_PHOTO_TYPES.has(file.type)) {
    return "Bilden måste vara en JPEG, PNG, WEBP eller HEIC-fil.";
  }
  return null;
}

export async function uploadCatchPhoto(file: File, userId: number): Promise<string> {
  const blob = await put(`catches/${userId}-${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

// Best-effort — an already-missing or already-deleted blob shouldn't block
// the catch itself from being saved/deleted.
export async function deleteCatchPhoto(url: string): Promise<void> {
  await del(url).catch(() => {});
}
