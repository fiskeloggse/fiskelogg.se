import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

function scopeCondition(userId: number, teamId: number | null) {
  const userCondition = teamId
    ? sql`c.user_id in (select id from users where team_id = ${teamId})`
    : sql`c.user_id = ${userId}`;
  return sql`${userCondition} and c.deleted_at is null`;
}

export type SpeciesBreakdownRow = { species: string; count: number };

export async function getSpeciesBreakdown(
  userId: number,
  teamId: number | null
): Promise<SpeciesBreakdownRow[]> {
  return sql<SpeciesBreakdownRow[]>`
    select species, count(*)::int as count
    from catches c
    where ${scopeCondition(userId, teamId)}
    group by species
    order by count desc, species asc
  `;
}

export type LakeBreakdownRow = { lake: string; count: number };

export async function getLakeBreakdown(
  userId: number,
  teamId: number | null
): Promise<LakeBreakdownRow[]> {
  return sql<LakeBreakdownRow[]>`
    select lake, count(*)::int as count
    from catches c
    where ${scopeCondition(userId, teamId)}
      and lake is not null and lake <> ''
    group by lake
    order by count desc, lake asc
  `;
}

export type FishingDayRow = { date: string; catches: number };

export async function getFishingDaysByDate(
  userId: number,
  teamId: number | null
): Promise<FishingDayRow[]> {
  return sql<FishingDayRow[]>`
    select
      (caught_at at time zone ${TIMEZONE})::date::text as date,
      count(*)::int as catches
    from catches c
    where ${scopeCondition(userId, teamId)}
    group by date
    order by date
  `;
}
