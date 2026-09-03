"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { getFiskepassCatches } from "@/lib/fiskepass";
import type { Catch } from "@/app/components/catch-list";

export type FiskepassState = { error: string } | { success: true } | undefined;

// Called directly from the client when a pass row is expanded -- fetched
// lazily per row instead of upfront for the whole history list.
export async function fetchFiskepassCatches(passId: number): Promise<Catch[]> {
  const user = await requireUser();
  return getFiskepassCatches(user.id, passId);
}

export async function startFiskepass(
  _prevState: FiskepassState,
  formData: FormData
): Promise<FiskepassState> {
  const user = await requireUser();

  const [existing] = await sql`
    select id from fiskepass where user_id = ${user.id} and stop_time is null
  `;
  if (existing) {
    return { error: "Du har redan ett pågående fiskepass." };
  }

  const targetSpecies = formData
    .getAll("targetSpecies")
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  try {
    await sql`
      insert into fiskepass (user_id, target_species, start_time)
      values (
        ${user.id},
        ${targetSpecies.length > 0 ? sql.array(targetSpecies) : null},
        now()
      )
    `;
  } catch (err) {
    // 23505 = unique_violation -- the double-submit race the pre-check
    // above can't fully rule out (fiskepass_one_open_per_user).
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return { error: "Du har redan ett pågående fiskepass." };
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/statistik");
  return { success: true };
}

export async function stopFiskepass(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`
    update fiskepass set stop_time = now()
    where id = ${id} and user_id = ${user.id} and stop_time is null
  `;

  revalidatePath("/");
  revalidatePath("/statistik");
}

const UpdateFiskepassSchema = z
  .object({
    id: z.coerce.number(),
    startTime: z.iso.datetime({ offset: true, error: "Ange en giltig starttid." }),
    // Empty means "still open" -- only a completed pass has a stop time.
    stopTime: z.string(),
  })
  .refine(
    (data) =>
      data.stopTime === "" ||
      z.iso.datetime({ offset: true }).safeParse(data.stopTime).success,
    { error: "Ange en giltig stopptid.", path: ["stopTime"] }
  )
  .refine(
    (data) => data.stopTime === "" || new Date(data.stopTime) > new Date(data.startTime),
    { error: "Stopptiden måste vara efter starttiden.", path: ["stopTime"] }
  );

export async function updateFiskepass(
  _prevState: FiskepassState,
  formData: FormData
): Promise<FiskepassState> {
  const user = await requireUser();

  const parsed = UpdateFiskepassSchema.safeParse({
    id: formData.get("id"),
    startTime: formData.get("startTime"),
    stopTime: formData.get("stopTime") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { id, startTime, stopTime } = parsed.data;

  try {
    await sql`
      update fiskepass
      set start_time = ${startTime}, stop_time = ${stopTime === "" ? null : stopTime}
      where id = ${id} and user_id = ${user.id}
    `;
  } catch (err) {
    // Clearing stop_time re-opens a pass -- 23505 means another one is
    // already open (fiskepass_one_open_per_user).
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return { error: "Du har redan ett annat pågående fiskepass." };
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/statistik");
  return { success: true };
}

export async function deleteFiskepass(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`delete from fiskepass where id = ${id} and user_id = ${user.id}`;

  revalidatePath("/");
  revalidatePath("/statistik");
}
