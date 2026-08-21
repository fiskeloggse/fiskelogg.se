import "server-only";
import sql from "./db";

export type LakeSuggestions = {
  recent: string[];
  common: string[];
  all: string[];
};

export async function getLakeSuggestions(
  userId: number
): Promise<LakeSuggestions> {
  const rows = await sql<
    { lake: string; catch_count: number; last_caught: Date }[]
  >`
    select lake, count(*)::int as catch_count, max(caught_at) as last_caught
    from catches
    where user_id = ${userId} and lake is not null and deleted_at is null
    group by lake
  `;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 3)
    .map((row) => row.lake);

  const recentSet = new Set(recent);

  const common = [...rows]
    .filter((row) => !recentSet.has(row.lake))
    .sort(
      (a, b) => b.catch_count - a.catch_count || a.lake.localeCompare(b.lake, "sv")
    )
    .slice(0, 5)
    .map((row) => row.lake);

  const all = rows
    .map((row) => row.lake)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, common, all };
}
