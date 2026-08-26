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

// Per-water stats for the "Antal vatten" drill-down: how many distinct
// days fished there, how many distinct platser logged, and total fish.
export type LakeStatsRow = {
  lake: string;
  days: number;
  platser: number;
  fish: number;
};

export async function getLakeStats(
  userId: number,
  teamId: number | null
): Promise<LakeStatsRow[]> {
  return sql<LakeStatsRow[]>`
    select
      lake,
      count(distinct (caught_at at time zone ${TIMEZONE})::date)::int as days,
      count(distinct nullif(location, ''))::int as platser,
      count(*)::int as fish
    from catches c
    where ${scopeCondition(userId, teamId)}
      and lake is not null and lake <> ''
    group by lake
    order by fish desc, lake asc
  `;
}

export type MappedCatchRow = {
  id: number;
  species: string | null;
  length_cm: number | null;
  weight_kg: number | null;
  caught_at: Date;
  latitude: number;
  longitude: number;
  lake: string;
};

// Only catches with both a position and a named water — each one needs to
// belong to a "vatten" pin on the map (lib/waters-map.tsx groups these by
// `lake` client-side to place one pin per water).
export async function getCatchesWithPosition(
  userId: number,
  teamId: number | null
): Promise<MappedCatchRow[]> {
  return sql<MappedCatchRow[]>`
    select c.id, c.species, c.length_cm, c.weight_kg, c.caught_at, c.latitude, c.longitude, c.lake
    from catches c
    where ${scopeCondition(userId, teamId)}
      and c.latitude is not null and c.longitude is not null
      and c.lake is not null and c.lake <> ''
    order by c.caught_at desc
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
