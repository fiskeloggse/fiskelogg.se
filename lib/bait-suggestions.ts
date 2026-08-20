import "server-only";
import sql from "./db";

export type BaitSuggestions = {
  recent: string[];
  common: string[];
  all: string[];
};

export async function getBaitSuggestions(
  userId: number
): Promise<BaitSuggestions> {
  const rows = await sql<
    { bait: string; catch_count: number; last_caught: Date }[]
  >`
    select bait, count(*)::int as catch_count, max(caught_at) as last_caught
    from catches
    where user_id = ${userId} and bait is not null and deleted_at is null
    group by bait
  `;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 3)
    .map((row) => row.bait);

  const recentSet = new Set(recent);

  const common = [...rows]
    .filter((row) => !recentSet.has(row.bait))
    .sort(
      (a, b) => b.catch_count - a.catch_count || a.bait.localeCompare(b.bait, "sv")
    )
    .slice(0, 5)
    .map((row) => row.bait);

  const all = rows
    .map((row) => row.bait)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, common, all };
}
