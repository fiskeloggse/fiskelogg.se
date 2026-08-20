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
  show_bingo: boolean;
  quick_log_fields: string[] | null;
  visible_register_columns: string[] | null;
  gps_default_enabled: boolean;
};

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session) return null;

  const [user] = await sql<User[]>`
    select id, email, name, team_id, show_bingo, quick_log_fields, visible_register_columns, gps_default_enabled
    from users where id = ${session.userId}
  `;

  return user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
