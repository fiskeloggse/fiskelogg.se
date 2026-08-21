"use server";

import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { TIMEZONE } from "@/lib/constants";

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

export type LakeVisitStats = { days: number; fishCount: number };

// Header stats for a lake drill-down: how many distinct days there and how
// many fish caught in total.
export async function getLakeVisitStats(lake: string): Promise<LakeVisitStats> {
  const user = await requireUser();
  const scopeCondition = user.team_id
    ? sql`c.user_id in (select id from users where team_id = ${user.team_id})`
    : sql`c.user_id = ${user.id}`;

  const [row] = await sql<{ days: number; fish_count: number }[]>`
    select
      count(distinct (c.caught_at at time zone ${TIMEZONE})::date)::int as days,
      count(*)::int as fish_count
    from catches c
    where ${scopeCondition}
      and c.deleted_at is null
      and c.lake = ${lake}
  `;

  return { days: row?.days ?? 0, fishCount: row?.fish_count ?? 0 };
}

export type TopCatchBySpeciesRow = TopCatchRow & { species: string };

// The 10 biggest catches of each species caught in one lake, for the lake
// drill-down page.
export async function getTopCatchesByLake(
  lake: string
): Promise<TopCatchBySpeciesRow[]> {
  const user = await requireUser();
  const scopeCondition = user.team_id
    ? sql`c.user_id in (select id from users where team_id = ${user.team_id})`
    : sql`c.user_id = ${user.id}`;

  return sql<TopCatchBySpeciesRow[]>`
    select id, species, length_cm, weight_kg, caught_at, angler_name
    from (
      select
        c.id, c.species, c.length_cm, c.weight_kg, c.caught_at, u.name as angler_name,
        row_number() over (
          partition by c.species
          order by c.length_cm desc nulls last, c.weight_kg desc nulls last
        ) as rn
      from catches c
      join users u on u.id = c.user_id
      where ${scopeCondition}
        and c.deleted_at is null
        and c.lake = ${lake}
        and (c.length_cm is not null or c.weight_kg is not null)
    ) ranked
    where rn <= 10
    order by species asc, length_cm desc nulls last, weight_kg desc nulls last
  `;
}
