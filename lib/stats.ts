import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

function scopeCondition(userId: number, teamId: number | null) {
  const userCondition = teamId
    ? sql`c.user_id in (select id from users where team_id = ${teamId})`
    : sql`c.user_id = ${userId}`;
  return sql`${userCondition} and c.deleted_at is null`;
}

export type StatsSummary = {
  species: number;
  lakes: number;
  fishingDays: number;
  catches: number;
};

export async function getStatsSummary(
  userId: number,
  teamId: number | null
): Promise<StatsSummary> {
  const [row] = await sql<
    { species: number; lakes: number; fishing_days: number; catches: number }[]
  >`
    select
      count(distinct species)::int as species,
      count(distinct lake) filter (where lake is not null)::int as lakes,
      count(distinct (caught_at at time zone ${TIMEZONE})::date)::int as fishing_days,
      count(*)::int as catches
    from catches c
    where ${scopeCondition(userId, teamId)}
  `;
  return {
    species: row.species,
    lakes: row.lakes,
    fishingDays: row.fishing_days,
    catches: row.catches,
  };
}

export type FishingDaysRow = { year: number; month: number; days: number };

export async function getFishingDaysByYearMonth(
  userId: number,
  teamId: number | null
): Promise<FishingDaysRow[]> {
  return sql<FishingDaysRow[]>`
    select
      extract(year from (caught_at at time zone ${TIMEZONE}))::int as year,
      extract(month from (caught_at at time zone ${TIMEZONE}))::int as month,
      count(distinct (caught_at at time zone ${TIMEZONE})::date)::int as days
    from catches c
    where ${scopeCondition(userId, teamId)}
    group by year, month
    order by year, month
  `;
}
