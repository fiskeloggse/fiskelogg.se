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
  const parsed = CatchSchema.safeParse({
    species: formData.get("species"),
    lengthCm:
      typeof rawLength === "string" && rawLength.trim() !== ""
        ? rawLength
        : undefined,
    weightKg:
      typeof rawWeight === "string" && rawWeight.trim() !== ""
        ? rawWeight
        : undefined,
    caughtAt:
      typeof rawCaughtAt === "string" && rawCaughtAt.trim() !== ""
        ? rawCaughtAt
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { species, lengthCm, weightKg, caughtAt } = parsed.data;

  // Normalize casing (e.g. "gädda" -> "Gädda") so the same species always
  // matches itself elsewhere — personbästa, filters, and bingo all compare
  // by exact species string.
  const [inserted] = await sql<{ id: number; species: string }[]>`
    insert into catches (user_id, species, length_cm, weight_kg, caught_at)
    values (${user.id}, initcap(${species}), ${lengthCm ?? null}, ${weightKg ?? null}, ${caughtAt ?? new Date()})
    returning id, species
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/personbasta");
  revalidatePath("/register");

  const notices: CatchNotices = {};

  if (lengthCm !== undefined) {
    const matches = await findMatchingBingoCards(
      user.id,
      user.team_id,
      inserted.species,
      lengthCm
    );
    if (matches.length > 0) {
      notices.bingoMatch = { species: inserted.species, cm: lengthCm };
    }
  }

  const previousBest = await getPreviousBest(user.id, inserted.species, inserted.id);
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
}
