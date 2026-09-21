"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { getTeamByInviteToken } from "@/lib/team";

// Set on /join/[token] when the visitor isn't logged in yet, so signup/login
// can finish the join in the same request once they authenticate --
// otherwise they'd have to re-open the link a second time after signing up.
const PENDING_INVITE_COOKIE = "pending_team_invite";

// Cookies can only be set from a Server Action or Route Handler, not while
// rendering the /join/[token] Server Component -- so the "Logga in"/"Skapa
// konto" links there are actually forms posting to this action, which sets
// the cookie and then redirects on to the chosen destination.
export async function redirectToAuthWithPendingInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const dest = formData.get("dest") === "signup" ? "/signup" : "/login";

  if (token) {
    const cookieStore = await cookies();
    cookieStore.set(PENDING_INVITE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60,
      path: "/",
    });
  }

  redirect(dest);
}

// Called from signup()/login() right after a session is created. Silently
// does nothing if the token is missing, invalid, or expired -- a bad or
// stale invite link shouldn't block signing in.
export async function consumePendingTeamInvite(userId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_INVITE_COOKIE)?.value;
  if (!token) return;
  cookieStore.delete(PENDING_INVITE_COOKIE);

  const team = await getTeamByInviteToken(token);
  if (!team) return;

  await sql`update users set team_id = ${team.id} where id = ${userId}`;
}

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

// Creates a team for the user if they don't have one yet (same as
// inviteToTeam), then sets (or overwrites) its invite link -- calling this
// again is how an existing link gets revoked, since the old token stops
// resolving to anything the moment it's replaced.
export async function refreshInviteLink() {
  const user = await requireUser();

  let teamId = user.team_id;
  if (!teamId) {
    const [team] = await sql<{ id: number }[]>`
      insert into teams default values returning id
    `;
    teamId = team.id;
    await sql`update users set team_id = ${teamId} where id = ${user.id}`;
  }

  const token = crypto.randomBytes(16).toString("hex");
  await sql`update teams set invite_token = ${token} where id = ${teamId}`;

  revalidatePath("/konto");
}

// The confirm button on /join/[token] for an already-logged-in visitor.
// (The signed-out path instead sets a cookie and finishes the join from
// inside signup()/login() -- see consumePendingTeamInvite above.) The page
// already validated the token before showing this button, so a lookup
// failure here can only mean it was just revoked in the last few seconds --
// rare enough to just silently no-op rather than surface a dedicated error.
export async function joinTeamByToken(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");

  const team = await getTeamByInviteToken(token);
  if (team && team.id !== user.team_id) {
    await sql`update users set team_id = ${team.id} where id = ${user.id}`;
    revalidatePath("/");
  }

  revalidatePath("/konto");
  redirect("/konto");
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
