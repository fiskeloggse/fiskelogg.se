import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import sql from "./db";
import { getSession } from "./session";

export type User = {
  id: number;
  email: string;
  name: string;
  team_id: number | null;
};

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session) return null;

  const [user] = await sql<User[]>`
    select id, email, name, team_id from users where id = ${session.userId}
  `;

  return user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
