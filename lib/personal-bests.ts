import "server-only";
import sql from "./db";

export type PersonalBest = {
  species: string;
  longest: { id: number; length_cm: number; caught_at: Date } | null;
  heaviest: { id: number; weight_kg: number; caught_at: Date } | null;
};

export type LongestRow = {
  id: number;
  species: string;
  length_cm: number;
  caught_at: Date;
};

export type HeaviestRow = {
  id: number;
  species: string;
  weight_kg: number;
  caught_at: Date;
};

export function buildPersonalBests(
  longestRows: LongestRow[],
  heaviestRows: HeaviestRow[]
): PersonalBest[] {
  const bySpecies = new Map<string, PersonalBest>();

  for (const row of longestRows) {
    bySpecies.set(row.species, {
      species: row.species,
      longest: { id: row.id, length_cm: row.length_cm, caught_at: row.caught_at },
      heaviest: null,
    });
  }

  for (const row of heaviestRows) {
    const heaviest = {
      id: row.id,
      weight_kg: row.weight_kg,
      caught_at: row.caught_at,
    };
    const existing = bySpecies.get(row.species);
    if (existing) {
      existing.heaviest = heaviest;
    } else {
      bySpecies.set(row.species, { species: row.species, longest: null, heaviest });
    }
  }

  return Array.from(bySpecies.values()).sort((a, b) =>
    a.species.localeCompare(b.species, "sv")
  );
}

export async function getPersonalBests(userId: number): Promise<PersonalBest[]> {
  const [longestRows, heaviestRows] = await Promise.all([
    sql<LongestRow[]>`
      select distinct on (species) id, species, length_cm, caught_at
      from catches
      where user_id = ${userId} and length_cm is not null
      order by species, length_cm desc, caught_at asc
    `,
    sql<HeaviestRow[]>`
      select distinct on (species) id, species, weight_kg, caught_at
      from catches
      where user_id = ${userId} and weight_kg is not null
      order by species, weight_kg desc, caught_at asc
    `,
  ]);

  return buildPersonalBests(longestRows, heaviestRows);
}

// The previous record for a species, excluding one catch (typically the one
// just inserted) — used to tell whether that catch is a new personal best.
export async function getPreviousBest(
  userId: number,
  species: string,
  excludeCatchId: number
): Promise<{ maxLength: number | null; maxWeight: number | null }> {
  const [row] = await sql<{ max_length: number | null; max_weight: number | null }[]>`
    select max(length_cm) as max_length, max(weight_kg) as max_weight
    from catches
    where user_id = ${userId} and species = ${species} and id <> ${excludeCatchId}
  `;
  return { maxLength: row?.max_length ?? null, maxWeight: row?.max_weight ?? null };
}
