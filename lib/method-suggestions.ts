import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

export type MethodSuggestions = {
  recent: string[];
  all: string[];
};

export async function getMethodSuggestions(
  userId: number
): Promise<MethodSuggestions> {
  const rows = await sql<
    { method: string; last_caught: Date; used_today: boolean }[]
  >`
    select
      method,
      max(caught_at) as last_caught,
      bool_or(
        (caught_at at time zone ${TIMEZONE})::date
          = (now() at time zone ${TIMEZONE})::date
      ) as used_today
    from catches
    where user_id = ${userId} and method is not null and deleted_at is null
    group by method
  `;

  // Normally just the single most recent method — but if today alone
  // already covers 2+ different methods, show up to 3 so today's variety
  // stays a tap away instead of being squeezed down to one.
  const usedTodayCount = rows.filter((row) => row.used_today).length;
  const recentSize = usedTodayCount >= 2 ? 3 : 1;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, recentSize)
    .map((row) => row.method);

  const all = rows
    .map((row) => row.method)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, all };
}
