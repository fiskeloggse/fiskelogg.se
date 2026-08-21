import "server-only";
import { put, del } from "@vercel/blob";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadCatchPhoto(
  file: File,
  userId: number
): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Bilden är för stor. Max 15 MB.");
  }

  const key = `catches/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensionFor(file.type)}`;
  const blob = await put(key, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });
  return blob.url;
}

// Best-effort cleanup — a failed delete shouldn't block replacing/removing
// the photo on the catch itself.
export async function deleteCatchPhoto(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // ignore
  }
}
