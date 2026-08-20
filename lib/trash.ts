import "server-only";
import sql from "./db";
import type { Catch } from "@/app/components/catch-list";

export type TrashedCatch = Catch & { deleted_at: Date };

export async function getTrashedCatches(userId: number): Promise<TrashedCatch[]> {
  return sql<TrashedCatch[]>`
    select id, user_id, species, length_cm, weight_kg, lake, location, bait, caught_at, deleted_at
    from catches
    where user_id = ${userId} and deleted_at is not null
    order by deleted_at desc
  `;
}
