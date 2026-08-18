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
