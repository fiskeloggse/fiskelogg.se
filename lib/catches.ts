import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

// Used to prefill "Sjö" when logging another catch the same day. Looks at
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
      and c.lake is not null
      and (c.caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
    order by c.caught_at desc
    limit 1
  `;
  return row?.lake ?? null;
}
