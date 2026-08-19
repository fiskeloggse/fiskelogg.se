"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

export type TeamState = { error: string } | undefined;

const InviteSchema = z.object({
  email: z.email({ error: "Ange en giltig e-postadress." }).trim(),
});

export async function inviteToTeam(
  _prevState: TeamState,
  formData: FormData
): Promise<TeamState> {
  const user = await requireUser();

  const parsed = InviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltig e-postadress." };
  }

  const email = parsed.data.email.toLowerCase();
  if (email === user.email.toLowerCase()) {
    return { error: "Du kan inte bjuda in dig själv." };
  }

  const [target] = await sql<{ id: number; team_id: number | null }[]>`
    select id, team_id from users where lower(email) = ${email}
  `;
  if (!target) {
    return {
      error:
        "Inget konto med den e-postadressen hittades. Personen måste skapa ett konto på Fisklogg först.",
    };
  }

  if (target.team_id !== null && target.team_id === user.team_id) {
    return { error: "Den personen är redan med i ditt team." };
  }

  let teamId = user.team_id;
  if (!teamId) {
    const [team] = await sql<{ id: number }[]>`
      insert into teams default values returning id
    `;
    teamId = team.id;
    await sql`update users set team_id = ${teamId} where id = ${user.id}`;
  }

  await sql`update users set team_id = ${teamId} where id = ${target.id}`;

  revalidatePath("/konto");
  revalidatePath("/");
}

export async function leaveTeam() {
  const user = await requireUser();
  await sql`update users set team_id = null where id = ${user.id}`;

  revalidatePath("/konto");
  revalidatePath("/");
}

const TeamNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Ange ett teamnamn." })
    .max(60, { error: "Teamnamnet är för långt (max 60 tecken)." }),
});

export async function updateTeamName(
  _prevState: TeamState,
  formData: FormData
): Promise<TeamState> {
  const user = await requireUser();
  if (!user.team_id) {
    return { error: "Du är inte med i något team." };
  }

  const parsed = TeamNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltigt namn." };
  }

  await sql`update teams set name = ${parsed.data.name} where id = ${user.team_id}`;

  revalidatePath("/konto");
  revalidatePath("/");
}
