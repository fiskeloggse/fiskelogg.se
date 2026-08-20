"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { findMatchingBingoCards } from "@/lib/bingo";
import { getPreviousBest } from "@/lib/personal-bests";

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

export type CatchState = { error: string } | CatchNotices | undefined;

const CatchSchema = z
  .object({
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
    bait: z.string().trim().max(100).optional(),
    caughtAt: z.coerce
      .date({ error: "Ogiltigt datum." })
      .max(new Date(), { error: "Datumet kan inte vara i framtiden." })
      .optional(),
  })
  .refine((data) => data.lengthCm !== undefined || data.weightKg !== undefined, {
    error: "Ange antingen längd eller vikt.",
    path: ["lengthCm"],
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
  const rawBait = formData.get("bait");
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
    bait: typeof rawBait === "string" && rawBait.trim() !== "" ? rawBait : undefined,
    caughtAt:
      typeof rawCaughtAt === "string" && rawCaughtAt.trim() !== ""
        ? rawCaughtAt
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { anglerId, species, lengthCm, weightKg, lake, location, bait, caughtAt } =
    parsed.data;

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

  // Normalize casing (e.g. "gädda" -> "Gädda") so the same species always
  // matches itself elsewhere — personbästa, filters, and bingo all compare
  // by exact species string.
  const [inserted] = await sql<{ id: number; species: string }[]>`
    insert into catches (user_id, species, length_cm, weight_kg, lake, location, bait, caught_at)
    values (
      ${anglerId}, initcap(${species}), ${lengthCm ?? null}, ${weightKg ?? null},
      ${lake ?? null}, ${location ?? null}, ${bait ?? null}, ${caughtAt ?? new Date()}
    )
    returning id, species
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/personbasta");
  revalidatePath("/register");

  const notices: CatchNotices = {};

  // Verified above: when anglerId !== user.id, the angler is in user.team_id.
  const [bingoMatches, previousBest] = await Promise.all([
    lengthCm !== undefined
      ? findMatchingBingoCards(anglerId, user.team_id, inserted.species, lengthCm)
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

  if (notices.bingoMatch || notices.personalBest) {
    return notices;
  }
}

export async function deleteCatch(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`delete from catches where id = ${id} and user_id = ${user.id}`;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/personbasta");
  revalidatePath("/register");
  revalidatePath("/statistik");
}

export async function deleteAllCatches() {
  const user = await requireUser();

  await sql`delete from catches where user_id = ${user.id}`;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/personbasta");
  revalidatePath("/register");
  revalidatePath("/statistik");
  revalidatePath("/konto");
}

const EditCatchSchema = z
  .object({
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
    bait: z.string().trim().max(100).optional(),
    caughtAt: z.coerce
      .date({ error: "Ogiltigt datum." })
      .max(new Date(), { error: "Datumet kan inte vara i framtiden." }),
  })
  .refine((data) => data.lengthCm !== undefined || data.weightKg !== undefined, {
    error: "Ange antingen längd eller vikt.",
    path: ["lengthCm"],
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
  const rawBait = formData.get("bait");
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
    bait: typeof rawBait === "string" && rawBait.trim() !== "" ? rawBait : undefined,
    caughtAt: formData.get("caughtAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { species, lengthCm, weightKg, lake, location, bait, caughtAt } =
    parsed.data;

  const result = await sql`
    update catches set
      species = initcap(${species}),
      length_cm = ${lengthCm ?? null},
      weight_kg = ${weightKg ?? null},
      lake = ${lake ?? null},
      location = ${location ?? null},
      bait = ${bait ?? null},
      caught_at = ${caughtAt}
    where id = ${id} and user_id = ${user.id}
  `;

  if (result.count === 0) {
    return { error: "Fångsten kunde inte hittas." };
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/personbasta");
  revalidatePath("/register");
  revalidatePath("/statistik");

  return { success: true };
}
