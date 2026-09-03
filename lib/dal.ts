import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import sql from "./db";
import { getSession } from "./session";
import type { GpsModeKey } from "./constants";

export type User = {
  id: number;
  email: string;
  name: string;
  team_id: number | null;
  show_bingo: boolean;
  show_species_collection: boolean;
  show_fiskepass: boolean;
  quick_log_fields: string[] | null;
  visible_register_columns: string[] | null;
  share_card_fields: string[] | null;
  gps_mode: GpsModeKey;
  hidden_species: string[] | null;
};

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session) return null;

  const [user] = await sql<User[]>`
    select id, email, name, team_id, show_bingo, show_species_collection, show_fiskepass, quick_log_fields, visible_register_columns, share_card_fields, gps_mode, hidden_species
    from users where id = ${session.userId}
  `;

  return user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
