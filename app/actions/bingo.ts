"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

export type BingoState = { error: string } | { success: true } | undefined;

// Empty means "no restriction" (all registered catches count) -- only
// validate the format when something was actually typed.
const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    error: "Ogiltigt datum.",
  })
  .transform((v) => (v === "" ? null : v));

const BingoSchema = z
  .object({
    mode: z.enum(["solo", "team"], { error: "Välj ensam eller team." }),
    species: z.string().trim().min(1, { error: "Välj en art." }).max(100),
    minCm: z.coerce
      .number({ error: "Ange en lägsta längd." })
      .int({ error: "Endast hela cm." })
      .min(0)
      .max(1000),
    maxCm: z.coerce
      .number({ error: "Ange en högsta längd." })
      .int({ error: "Endast hela cm." })
      .min(0)
      .max(1000),
    fromDate: optionalDate,
    toDate: optionalDate,
  })
  .refine((data) => data.maxCm >= data.minCm, {
    error: "Högsta längd måste vara minst lika stor som lägsta.",
    path: ["maxCm"],
  })
  .refine((data) => data.maxCm - data.minCm <= 200, {
    error: "Intervallet är för stort (max 200 cm).",
    path: ["maxCm"],
  })
  .refine((data) => Boolean(data.fromDate) === Boolean(data.toDate), {
    error: "Fyll i både startdatum och slutdatum, eller lämna båda tomma.",
    path: ["toDate"],
  })
  .refine((data) => !data.fromDate || !data.toDate || data.toDate >= data.fromDate, {
    error: "Slutdatumet måste vara efter startdatumet.",
    path: ["toDate"],
  });

export async function createBingoCard(
  _prevState: BingoState,
  formData: FormData
): Promise<BingoState> {
  const user = await requireUser();

  const parsed = BingoSchema.safeParse({
    mode: formData.get("mode"),
    species: formData.get("species"),
    minCm: formData.get("minCm"),
    maxCm: formData.get("maxCm"),
    fromDate: formData.get("fromDate"),
    toDate: formData.get("toDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { mode, species, minCm, maxCm, fromDate, toDate } = parsed.data;

  if (mode === "team" && !user.team_id) {
    return { error: "Du måste vara med i ett team för en team-bricka." };
  }

  const teamId = mode === "team" ? user.team_id : null;

  await sql`
    insert into bingo_cards (team_id, species, min_cm, max_cm, created_by, from_date, to_date)
    values (${teamId}, initcap(${species}), ${minCm}, ${maxCm}, ${user.id}, ${fromDate}, ${toDate})
  `;

  revalidatePath("/challenges");
  return { success: true };
}

export async function deleteBingoCard(formData: FormData) {
  const user = await requireUser();

  const id = Number(formData.get("id"));
  if (!id) return;

  await sql`
    delete from bingo_cards
    where id = ${id}
      and (
        created_by = ${user.id}
        or (team_id is not null and team_id = ${user.team_id})
      )
  `;

  revalidatePath("/challenges");
}
