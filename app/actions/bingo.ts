"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

export type BingoState = { error: string } | undefined;

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
  })
  .refine((data) => data.maxCm >= data.minCm, {
    error: "Högsta längd måste vara minst lika stor som lägsta.",
    path: ["maxCm"],
  })
  .refine((data) => data.maxCm - data.minCm <= 200, {
    error: "Intervallet är för stort (max 200 cm).",
    path: ["maxCm"],
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { mode, species, minCm, maxCm } = parsed.data;

  if (mode === "team" && !user.team_id) {
    return { error: "Du måste vara med i ett team för en team-bricka." };
  }

  const teamId = mode === "team" ? user.team_id : null;

  await sql`
    insert into bingo_cards (team_id, species, min_cm, max_cm, created_by)
    values (${teamId}, initcap(${species}), ${minCm}, ${maxCm}, ${user.id})
  `;

  revalidatePath("/bingo");
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

  revalidatePath("/bingo");
}
