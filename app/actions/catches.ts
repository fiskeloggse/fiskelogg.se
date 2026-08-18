"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

export type CatchState = { error: string } | undefined;

const CatchSchema = z.object({
  species: z.string().trim().max(100).optional(),
  lengthCm: z.coerce
    .number({ error: "Ange fiskens längd." })
    .positive({ error: "Längden måste vara större än noll." })
    .max(1000, { error: "Det verkar vara en väldigt stor fisk." }),
  weightKg: z.coerce
    .number({ error: "Ange fiskens vikt." })
    .positive({ error: "Vikten måste vara större än noll." })
    .max(1000, { error: "Det verkar vara en väldigt tung fisk." })
    .optional(),
});

export async function addCatch(
  _prevState: CatchState,
  formData: FormData
): Promise<CatchState> {
  const user = await requireUser();

  const rawSpecies = formData.get("species");
  const rawWeight = formData.get("weightKg");
  const parsed = CatchSchema.safeParse({
    species:
      typeof rawSpecies === "string" && rawSpecies.trim() !== ""
        ? rawSpecies
        : undefined,
    lengthCm: formData.get("lengthCm"),
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

  await sql`
    insert into catches (user_id, species, length_cm, weight_kg, caught_at)
    values (${user.id}, ${species ?? null}, ${lengthCm}, ${weightKg ?? null}, ${caughtAt})
  `;

  revalidatePath("/");
}

export async function deleteCatch(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`delete from catches where id = ${id} and user_id = ${user.id}`;

  revalidatePath("/");
}
