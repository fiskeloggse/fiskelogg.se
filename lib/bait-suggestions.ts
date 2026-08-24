import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

export type BaitSuggestions = {
  recent: string[];
  all: string[];
};

export async function getBaitSuggestions(
  userId: number
): Promise<BaitSuggestions> {
  const rows = await sql<
    { bait: string; last_caught: Date; used_today: boolean }[]
  >`
    select
      bait,
      max(caught_at) as last_caught,
      bool_or(
        (caught_at at time zone ${TIMEZONE})::date
          = (now() at time zone ${TIMEZONE})::date
      ) as used_today
    from catches
    where user_id = ${userId} and bait is not null and deleted_at is null
    group by bait
  `;

  // Normally just the single most recent bait — but if today alone already
  // covers 2+ different baits, show up to 3 so today's variety stays a tap
  // away instead of being squeezed down to one.
  const usedTodayCount = rows.filter((row) => row.used_today).length;
  const recentSize = usedTodayCount >= 2 ? 3 : 1;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, recentSize)
    .map((row) => row.bait);

  const all = rows
    .map((row) => row.bait)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, all };
}
