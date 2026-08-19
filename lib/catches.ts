import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

// Used to prefill "Sjö" when logging another catch the same day.
export async function getTodaysLastLake(userId: number): Promise<string | null> {
  const [row] = await sql<{ lake: string | null }[]>`
    select lake
    from catches
    where user_id = ${userId}
      and lake is not null
      and (caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
    order by caught_at desc
    limit 1
  `;
  return row?.lake ?? null;
}
