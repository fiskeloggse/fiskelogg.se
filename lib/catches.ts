import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

// Used to prefill "Vatten" when logging another catch the same day. Looks at
// the whole team's catches (not just this user's own) so it still carries
// over when logging a catch on behalf of a teammate.
export async function getTodaysLastLake(
  userId: number,
  teamId: number | null
): Promise<string | null> {
  const scopeCondition = teamId
    ? sql`c.user_id in (select id from users where team_id = ${teamId})`
    : sql`c.user_id = ${userId}`;

  const [row] = await sql<{ lake: string | null }[]>`
    select c.lake
    from catches c
    where ${scopeCondition}
      and c.deleted_at is null
      and c.lake is not null
      and (c.caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
    order by c.caught_at desc
    limit 1
  `;
  return row?.lake ?? null;
}

// Used to prefill "Bete" when logging another catch the same day.
export async function getTodaysLastBait(
  userId: number,
  teamId: number | null
): Promise<string | null> {
  const scopeCondition = teamId
    ? sql`c.user_id in (select id from users where team_id = ${teamId})`
    : sql`c.user_id = ${userId}`;

  const [row] = await sql<{ bait: string | null }[]>`
    select c.bait
    from catches c
    where ${scopeCondition}
      and c.deleted_at is null
      and c.bait is not null
      and (c.caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
    order by c.caught_at desc
    limit 1
  `;
  return row?.bait ?? null;
}

// Used to prefill "Fiskemetod" when logging another catch the same day.
export async function getTodaysLastMethod(
  userId: number,
  teamId: number | null
): Promise<string | null> {
  const scopeCondition = teamId
    ? sql`c.user_id in (select id from users where team_id = ${teamId})`
    : sql`c.user_id = ${userId}`;

  const [row] = await sql<{ method: string | null }[]>`
    select c.method
    from catches c
    where ${scopeCondition}
      and c.deleted_at is null
      and c.method is not null
      and (c.caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
    order by c.caught_at desc
    limit 1
  `;
  return row?.method ?? null;
}

export type TodaysSummary = {
  count: number;
  biggest: { species: string; length_cm: number | null; weight_kg: number | null } | null;
};

// Powers the "Idag" line on the homepage — how many catches so far today,
// and the biggest one (by length, falling back to weight). Personal only,
// not team-wide: it's meant to answer "how am I doing today", not the
// team's combined total.
export async function getTodaysSummary(userId: number): Promise<TodaysSummary> {
  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from catches
    where user_id = ${userId}
      and deleted_at is null
      and (caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
  `;

  const [biggest] = await sql<
    { species: string; length_cm: number | null; weight_kg: number | null }[]
  >`
    select species, length_cm, weight_kg
    from catches
    where user_id = ${userId}
      and deleted_at is null
      and (caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
      and (length_cm is not null or weight_kg is not null)
    order by length_cm desc nulls last, weight_kg desc nulls last
    limit 1
  `;

  return { count: countRow?.count ?? 0, biggest: biggest ?? null };
}

export async function getOwnCatchCount(userId: number): Promise<number> {
  const [row] = await sql<{ count: number }[]>`
    select count(*)::int as count from catches where user_id = ${userId} and deleted_at is null
  `;
  return row?.count ?? 0;
}
