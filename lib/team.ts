import "server-only";
import sql from "./db";

export type TeamMember = {
  id: number;
  name: string;
  email: string;
};

export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  return sql<TeamMember[]>`
    select id, name, email from users where team_id = ${teamId} order by name
  `;
}

export async function getTeamName(teamId: number): Promise<string | null> {
  const [row] = await sql<{ name: string | null }[]>`
    select name from teams where id = ${teamId}
  `;
  return row?.name ?? null;
}

export async function getTeamInviteToken(teamId: number): Promise<string | null> {
  const [row] = await sql<{ invite_token: string | null }[]>`
    select invite_token from teams where id = ${teamId}
  `;
  return row?.invite_token ?? null;
}

export async function getTeamByInviteToken(
  token: string
): Promise<{ id: number; name: string | null } | null> {
  const [team] = await sql<{ id: number; name: string | null }[]>`
    select id, name from teams where invite_token = ${token}
  `;
  return team ?? null;
}
