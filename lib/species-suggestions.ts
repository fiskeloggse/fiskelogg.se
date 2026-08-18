import "server-only";
import sql from "./db";

export type SpeciesSuggestions = {
  recent: string[];
  common: string[];
  all: string[];
};

export async function getSpeciesSuggestions(
  userId: number
): Promise<SpeciesSuggestions> {
  const rows = await sql<
    { species: string; catch_count: number; last_caught: Date }[]
  >`
    select species, count(*)::int as catch_count, max(caught_at) as last_caught
    from catches
    where user_id = ${userId}
    group by species
  `;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 3)
    .map((row) => row.species);

  const recentSet = new Set(recent);

  const common = [...rows]
    .filter((row) => !recentSet.has(row.species))
    .sort(
      (a, b) =>
        b.catch_count - a.catch_count || a.species.localeCompare(b.species, "sv")
    )
    .slice(0, 5)
    .map((row) => row.species);

  const all = rows
    .map((row) => row.species)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, common, all };
}
