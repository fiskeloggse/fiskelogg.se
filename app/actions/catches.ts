"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { findMatchingBingoCards } from "@/lib/bingo";

export type CatchState =
  | { error: string }
  | { bingoMatch: { species: string; cm: number } }
  | undefined;

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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { species, lengthCm, weightKg } = parsed.data;
  const caughtAt = new Date();

  // Normalize casing (e.g. "gädda" -> "Gädda") so the same species always
  // matches itself elsewhere — personbästa, filters, and bingo all compare
  // by exact species string.
  const [inserted] = await sql<{ species: string }[]>`
    insert into catches (user_id, species, length_cm, weight_kg, caught_at)
    values (${user.id}, initcap(${species}), ${lengthCm ?? null}, ${weightKg ?? null}, ${caughtAt})
    returning species
  `;

  revalidatePath("/");
  revalidatePath("/bingo");

  if (lengthCm !== undefined) {
    const matches = await findMatchingBingoCards(
      user.id,
      user.team_id,
      inserted.species,
      lengthCm
    );
    if (matches.length > 0) {
      return { bingoMatch: { species: inserted.species, cm: lengthCm } };
    }
  }
}

export async function deleteCatch(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`delete from catches where id = ${id} and user_id = ${user.id}`;

  revalidatePath("/");
}
