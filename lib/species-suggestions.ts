import "server-only";
import sql from "./db";

export type SpeciesSuggestions = {
  recent: string[];
  all: string[];
};

export async function getSpeciesSuggestions(
  userId: number
): Promise<SpeciesSuggestions> {
  const rows = await sql<
    { species: string; last_caught: Date }[]
  >`
    select species, max(caught_at) as last_caught
    from catches
    where user_id = ${userId} and deleted_at is null
    group by species
  `;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 3)
    .map((row) => row.species);

  const all = rows
    .map((row) => row.species)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, all };
}
