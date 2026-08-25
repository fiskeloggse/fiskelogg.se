"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { findMatchingBingoCards } from "@/lib/bingo";
import { getPreviousBest } from "@/lib/personal-bests";
import { getWeatherAt } from "@/lib/weather";

export type CatchNotices = {
  bingoMatch?: { species: string; cm: number };
  personalBest?: {
    species: string;
    isLongest: boolean;
    isHeaviest: boolean;
    lengthCm?: number;
    weightKg?: number;
  };
};

export type CatchState =
  | { error: string }
  | (CatchNotices & { insertedId: number })
  | undefined;

const CatchSchema = z.object({
  anglerId: z.coerce.number({ error: "Ogiltig fiskare." }).int().positive(),
  species: z
    .string()
    .trim()
    .min(1, { error: "Välj eller ange en art." })
    .max(100),
  lengthCm: z.coerce
    .number({ error: "Ange fiskens längd." })
    .int({ error: "Längden anges i hela cm." })
    .positive({ error: "Längden måste vara större än noll." })
    .max(1000, { error: "Det verkar vara en väldigt stor fisk." })
    .optional(),
  weightKg: z.coerce
    .number({ error: "Ange fiskens vikt." })
    .positive({ error: "Vikten måste vara större än noll." })
    .max(1000, { error: "Det verkar vara en väldigt tung fisk." })
    .optional(),
  lake: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  method: z.string().trim().max(100).optional(),
  bait: z.string().trim().max(100).optional(),
  comment: z.string().trim().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  caughtAt: z.coerce
    .date({ error: "Ogiltigt datum." })
    // A plain .max(new Date()) would freeze "now" to whenever this schema
    // module first loads — fine for a single request, but wrong in a
    // long-running dev server or warm serverless instance, where it
    // silently drifts into the past. .refine() re-evaluates its callback
    // on every parse, so "now" stays current.
    .refine((d) => d <= new Date(), {
      error: "Datumet kan inte vara i framtiden.",
    })
    .optional(),
});

export async function addCatch(
  _prevState: CatchState,
  formData: FormData
): Promise<CatchState> {
  const user = await requireUser();

  const rawLength = formData.get("lengthCm");
  const rawWeight = formData.get("weightKg");
  const rawCaughtAt = formData.get("caughtAt");
  const rawLake = formData.get("lake");
  const rawLocation = formData.get("location");
  const rawMethod = formData.get("method");
  const rawBait = formData.get("bait");
  const rawComment = formData.get("comment");
  const rawLatitude = formData.get("latitude");
  const rawLongitude = formData.get("longitude");
  const rawAnglerId = formData.get("anglerId");
  const parsed = CatchSchema.safeParse({
    anglerId:
      typeof rawAnglerId === "string" && rawAnglerId.trim() !== ""
        ? rawAnglerId
        : user.id,
    species: formData.get("species"),
    lengthCm:
      typeof rawLength === "string" && rawLength.trim() !== ""
        ? rawLength
        : undefined,
    weightKg:
      typeof rawWeight === "string" && rawWeight.trim() !== ""
        ? rawWeight
        : undefined,
    lake: typeof rawLake === "string" && rawLake.trim() !== "" ? rawLake : undefined,
    location:
      typeof rawLocation === "string" && rawLocation.trim() !== ""
        ? rawLocation
        : undefined,
    method:
      typeof rawMethod === "string" && rawMethod.trim() !== ""
        ? rawMethod
        : undefined,
    bait: typeof rawBait === "string" && rawBait.trim() !== "" ? rawBait : undefined,
    comment:
      typeof rawComment === "string" && rawComment.trim() !== ""
        ? rawComment
        : undefined,
    latitude:
      typeof rawLatitude === "string" && rawLatitude.trim() !== ""
        ? rawLatitude
        : undefined,
    longitude:
      typeof rawLongitude === "string" && rawLongitude.trim() !== ""
        ? rawLongitude
        : undefined,
    caughtAt:
      typeof rawCaughtAt === "string" && rawCaughtAt.trim() !== ""
        ? rawCaughtAt
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const {
    anglerId,
    species,
    lengthCm,
    weightKg,
    lake,
    location,
    method,
    bait,
    comment,
    latitude,
    longitude,
    caughtAt,
  } = parsed.data;

  // Logging for someone else is only allowed within your own team.
  if (anglerId !== user.id) {
    if (!user.team_id) {
      return { error: "Du kan bara logga åt lagkamrater i ditt team." };
    }
    const [angler] = await sql<{ team_id: number | null }[]>`
      select team_id from users where id = ${anglerId}
    `;
    if (!angler || angler.team_id !== user.team_id) {
      return { error: "Den fiskaren är inte med i ditt team." };
    }
  }

  // Position and weather are logged independently per catch (see the
  // "Logga position"/"Logga väder" checkboxes in catch-form.tsx) — the
  // account's gps_mode only controls their default checked state, not
  // whether they're honored here.
  const logPosition = formData.get("logPosition") === "on";
  const logWeather = formData.get("logWeather") === "on";
  let persistedLatitude: number | null = null;
  let persistedLongitude: number | null = null;
  let weather: Awaited<ReturnType<typeof getWeatherAt>> = null;

  if (latitude !== undefined && longitude !== undefined) {
    if (logPosition) {
      persistedLatitude = latitude;
      persistedLongitude = longitude;
    }
    if (logWeather) {
      weather = await getWeatherAt(latitude, longitude, caughtAt ?? new Date());
    }
  }

  // Normalize casing (e.g. "gädda" -> "Gädda") so the same species always
  // matches itself elsewhere — personbästa, filters, and bingo all compare
  // by exact species string.
  const [inserted] = await sql<{ id: number; species: string }[]>`
    insert into catches (
      user_id, species, length_cm, weight_kg, lake, location, method, bait, comment, latitude, longitude, caught_at,
      weather_temp_c, weather_description, weather_wind_kmh, weather_wind_dir_deg, weather_pressure_hpa, weather_cloud_pct
    )
    values (
      ${anglerId}, initcap(${species}), ${lengthCm ?? null}, ${weightKg ?? null},
      ${lake ?? null}, ${location ?? null}, ${method ?? null}, ${bait ?? null}, ${comment ?? null},
      ${persistedLatitude}, ${persistedLongitude}, ${caughtAt ?? new Date()},
      ${weather?.temp_c ?? null}, ${weather?.description ?? null}, ${weather?.wind_kmh ?? null},
      ${weather?.wind_dir_deg ?? null}, ${weather?.pressure_hpa ?? null}, ${weather?.cloud_pct ?? null}
    )
    returning id, species
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/statistik");
  revalidatePath("/register");

  const notices: CatchNotices = {};

  // Verified above: when anglerId !== user.id, the angler is in user.team_id.
  const [bingoMatches, previousBest] = await Promise.all([
    lengthCm !== undefined
      ? findMatchingBingoCards(
          anglerId,
          user.team_id,
          inserted.species,
          lengthCm,
          caughtAt ?? new Date()
        )
      : Promise.resolve([]),
    getPreviousBest(anglerId, inserted.species, inserted.id),
  ]);

  if (bingoMatches.length > 0 && lengthCm !== undefined) {
    notices.bingoMatch = { species: inserted.species, cm: lengthCm };
  }

  const isLongest =
    lengthCm !== undefined &&
    (previousBest.maxLength === null || lengthCm > previousBest.maxLength);
  const isHeaviest =
    weightKg !== undefined &&
    (previousBest.maxWeight === null || weightKg > previousBest.maxWeight);

  if (isLongest || isHeaviest) {
    notices.personalBest = {
      species: inserted.species,
      isLongest,
      isHeaviest,
      lengthCm,
      weightKg,
    };
  }

  return { insertedId: inserted.id, ...notices };
}

// Patches in a lake/water name found after the fact — used when the GPS
// reverse-geocode lookup resolves only after the catch was already
// submitted, so the name doesn't silently end up on the next catch logged
// instead. Only applies while the field is still empty, so it never
// overwrites something the user (or a later edit) already set.
export async function updateCatchLake(id: number, lake: string) {
  const user = await requireUser();

  const result = await sql`
    update catches set lake = ${lake}
    where id = ${id} and user_id = ${user.id} and deleted_at is null and lake is null
  `;

  if (result.count === 0) return;

  revalidatePath("/");
  revalidatePath("/register");
  revalidatePath(`/register/${id}`);
}

// Soft delete — moves the catch to the trash (papperskorg) instead of
// removing it outright, so it can be restored or purged later.
export async function deleteCatch(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`
    update catches set deleted_at = now()
    where id = ${id} and user_id = ${user.id} and deleted_at is null
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/register");
  revalidatePath("/register/papperskorg");
  revalidatePath(`/register/${id}`);
  revalidatePath("/statistik");
}

// Soft delete of a selected set of catches (bulk-select in Register).
export async function deleteCatches(formData: FormData) {
  const user = await requireUser();
  const ids = formData
    .getAll("ids")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return;

  await sql`
    update catches set deleted_at = now()
    where user_id = ${user.id} and id = any(${sql.array(ids)}::int[]) and deleted_at is null
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/register");
  revalidatePath("/register/papperskorg");
  revalidatePath("/statistik");
}

export async function deleteAllCatches() {
  const user = await requireUser();

  await sql`
    update catches set deleted_at = now()
    where user_id = ${user.id} and deleted_at is null
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/register");
  revalidatePath("/register/papperskorg");
  revalidatePath("/statistik");
  revalidatePath("/konto");
}

const EditCatchSchema = z.object({
  species: z
    .string()
    .trim()
    .min(1, { error: "Välj eller ange en art." })
    .max(100),
  lengthCm: z.coerce
    .number({ error: "Ange fiskens längd." })
    .int({ error: "Längden anges i hela cm." })
    .positive({ error: "Längden måste vara större än noll." })
    .max(1000, { error: "Det verkar vara en väldigt stor fisk." })
    .optional(),
  weightKg: z.coerce
    .number({ error: "Ange fiskens vikt." })
    .positive({ error: "Vikten måste vara större än noll." })
    .max(1000, { error: "Det verkar vara en väldigt tung fisk." })
    .optional(),
  lake: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  method: z.string().trim().max(100).optional(),
  bait: z.string().trim().max(100).optional(),
  comment: z.string().trim().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  caughtAt: z.coerce
    .date({ error: "Ogiltigt datum." })
    // See the comment on the same check in CatchSchema above — .refine()
    // re-evaluates "now" per parse instead of freezing it at module load.
    .refine((d) => d <= new Date(), {
      error: "Datumet kan inte vara i framtiden.",
    }),
});

export type EditCatchState = { error: string } | { success: true } | undefined;

export async function updateCatch(
  _prevState: EditCatchState,
  formData: FormData
): Promise<EditCatchState> {
  const user = await requireUser();

  const id = Number(formData.get("id"));
  if (!id) return { error: "Ogiltig fångst." };

  const rawLength = formData.get("lengthCm");
  const rawWeight = formData.get("weightKg");
  const rawLake = formData.get("lake");
  const rawLocation = formData.get("location");
  const rawMethod = formData.get("method");
  const rawBait = formData.get("bait");
  const rawComment = formData.get("comment");
  const rawLatitude = formData.get("latitude");
  const rawLongitude = formData.get("longitude");
  const parsed = EditCatchSchema.safeParse({
    species: formData.get("species"),
    lengthCm:
      typeof rawLength === "string" && rawLength.trim() !== ""
        ? rawLength
        : undefined,
    weightKg:
      typeof rawWeight === "string" && rawWeight.trim() !== ""
        ? rawWeight
        : undefined,
    lake: typeof rawLake === "string" && rawLake.trim() !== "" ? rawLake : undefined,
    location:
      typeof rawLocation === "string" && rawLocation.trim() !== ""
        ? rawLocation
        : undefined,
    method:
      typeof rawMethod === "string" && rawMethod.trim() !== ""
        ? rawMethod
        : undefined,
    bait: typeof rawBait === "string" && rawBait.trim() !== "" ? rawBait : undefined,
    comment:
      typeof rawComment === "string" && rawComment.trim() !== ""
        ? rawComment
        : undefined,
    latitude:
      typeof rawLatitude === "string" && rawLatitude.trim() !== ""
        ? rawLatitude
        : undefined,
    longitude:
      typeof rawLongitude === "string" && rawLongitude.trim() !== ""
        ? rawLongitude
        : undefined,
    caughtAt: formData.get("caughtAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const {
    species,
    lengthCm,
    weightKg,
    lake,
    location,
    method,
    bait,
    comment,
    latitude,
    longitude,
    caughtAt,
  } = parsed.data;

  const result = await sql`
    update catches set
      species = initcap(${species}),
      length_cm = ${lengthCm ?? null},
      weight_kg = ${weightKg ?? null},
      lake = ${lake ?? null},
      location = ${location ?? null},
      method = ${method ?? null},
      bait = ${bait ?? null},
      comment = ${comment ?? null},
      latitude = ${latitude ?? null},
      longitude = ${longitude ?? null},
      caught_at = ${caughtAt}
    where id = ${id} and user_id = ${user.id} and deleted_at is null
  `;

  if (result.count === 0) {
    return { error: "Fångsten kunde inte hittas." };
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/register");
  revalidatePath(`/register/${id}`);
  revalidatePath("/statistik");

  return { success: true };
}
