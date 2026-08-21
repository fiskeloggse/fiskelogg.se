import "server-only";
import sql from "./db";

export type LakeSuggestions = {
  recent: string[];
  all: string[];
};

export async function getLakeSuggestions(
  userId: number
): Promise<LakeSuggestions> {
  const rows = await sql<
    { lake: string; last_caught: Date }[]
  >`
    select lake, max(caught_at) as last_caught
    from catches
    where user_id = ${userId} and lake is not null and deleted_at is null
    group by lake
  `;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 1)
    .map((row) => row.lake);

  const all = rows
    .map((row) => row.lake)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, all };
}
