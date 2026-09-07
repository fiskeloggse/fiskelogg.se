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
    select id from fiskepass
    where user_id = ${user.id} and stop_time is null and deleted_at is null
  `;
  if (existing) {
    return { error: "Du har redan ett pågående fiskepass." };
  }

  const targetSpecies = formData
    .getAll("targetSpecies")
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const mode = formData.get("mode") === "team" ? "team" : "solo";
  if (mode === "team" && !user.team_id) {
    return { error: "Du måste vara med i ett team för ett team-pass." };
  }
  const teamId = mode === "team" ? user.team_id : null;

  if (teamId) {
    const [existingTeamPass] = await sql`
      select id from fiskepass
      where team_id = ${teamId} and stop_time is null and deleted_at is null
    `;
    if (existingTeamPass) {
      return { error: "Ditt team har redan ett pågående fiskepass." };
    }
  }

  try {
    await sql`
      insert into fiskepass (user_id, team_id, target_species, start_time)
      values (
        ${user.id},
        ${teamId},
        ${targetSpecies.length > 0 ? sql.array(targetSpecies) : null},
        now()
      )
    `;
  } catch (err) {
    // 23505 = unique_violation -- the double-submit race the pre-checks
    // above can't fully rule out (fiskepass_one_open_per_user /
    // fiskepass_one_open_per_team).
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return {
        error: teamId
          ? "Ditt team har redan ett pågående fiskepass."
          : "Du har redan ett pågående fiskepass.",
      };
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

  // Any team member can end a team pass, not just whoever started it --
  // it reads as shared for everyone on the team, so ending it should be too.
  await sql`
    update fiskepass set stop_time = now()
    where id = ${id}
      and stop_time is null
      and (
        user_id = ${user.id}
        or (team_id is not null and team_id = ${user.team_id})
      )
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
      where id = ${id} and user_id = ${user.id} and deleted_at is null
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

// Soft delete, mirroring how a single catch moves to Papperskorg instead of
// vanishing outright. The catches within the pass's time window are never
// touched -- they stay in Fångster exactly as before.
export async function deleteFiskepass(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`
    update fiskepass set deleted_at = now()
    where id = ${id} and user_id = ${user.id} and deleted_at is null
  `;

  revalidatePath("/");
  revalidatePath("/statistik");
  revalidatePath("/register/fiskepass");
  revalidatePath("/register/fiskepass/papperskorg");
}

function parseFiskepassIds(formData: FormData): number[] {
  return formData
    .getAll("ids")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

export async function restoreFiskepass(formData: FormData): Promise<void> {
  const user = await requireUser();
  const ids = parseFiskepassIds(formData);
  if (ids.length === 0) return;

  try {
    await sql`
      update fiskepass set deleted_at = null
      where user_id = ${user.id} and id = any(${sql.array(ids)}::int[]) and deleted_at is not null
    `;
  } catch (err) {
    // 23505 -- restoring an open pass while another one is already open
    // (fiskepass_one_open_per_user/_team) is refused rather than silently
    // reopening a second concurrent pass.
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return;
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/statistik");
  revalidatePath("/register/fiskepass");
  revalidatePath("/register/fiskepass/papperskorg");
}

export async function permanentlyDeleteFiskepass(formData: FormData): Promise<void> {
  const user = await requireUser();
  const ids = parseFiskepassIds(formData);
  if (ids.length === 0) return;

  await sql`
    delete from fiskepass
    where user_id = ${user.id} and id = any(${sql.array(ids)}::int[]) and deleted_at is not null
  `;

  revalidatePath("/register/fiskepass/papperskorg");
}
