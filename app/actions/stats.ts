"use server";

import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

export type TopCatchRow = {
  id: number;
  length_cm: number | null;
  weight_kg: number | null;
  caught_at: Date;
  angler_name: string;
};

// The biggest catches of one species, for the drill-down when a user taps
// a species in the breakdown chart or its personal-best entry.
export async function getTopCatchesForSpecies(
  species: string
): Promise<TopCatchRow[]> {
  const user = await requireUser();
  const scopeCondition = user.team_id
    ? sql`c.user_id in (select id from users where team_id = ${user.team_id})`
    : sql`c.user_id = ${user.id}`;

  return sql<TopCatchRow[]>`
    select c.id, c.length_cm, c.weight_kg, c.caught_at, u.name as angler_name
    from catches c
    join users u on u.id = c.user_id
    where ${scopeCondition}
      and c.deleted_at is null
      and c.species = ${species}
      and (c.length_cm is not null or c.weight_kg is not null)
    order by c.length_cm desc nulls last, c.weight_kg desc nulls last
    limit 10
  `;
}
