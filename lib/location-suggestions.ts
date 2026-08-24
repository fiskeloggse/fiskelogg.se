import "server-only";
import sql from "./db";

// Locations grouped by the water they were logged with, so "Plats"
// suggestions can be narrowed to whatever "Vatten" is currently filled in.
// Catches with no lake set are grouped under the "" key.
export type LocationsByLake = Record<string, string[]>;

export type LocationSuggestions = {
  recent: string[];
  byLake: LocationsByLake;
};

export async function getLocationSuggestions(
  userId: number
): Promise<LocationSuggestions> {
  const rows = await sql<
    { lake: string | null; location: string; last_caught: Date }[]
  >`
    select lake, location, max(caught_at) as last_caught
    from catches
    where user_id = ${userId} and location is not null and deleted_at is null
    group by lake, location
  `;

  const byLake: LocationsByLake = {};
  for (const row of rows) {
    const key = row.lake ?? "";
    (byLake[key] ??= []).push(row.location);
  }
  for (const locations of Object.values(byLake)) {
    locations.sort((a, b) => a.localeCompare(b, "sv"));
  }

  // Mirrors getLakeSuggestions: just the single most recently used Plats,
  // so the "Senaste" chip row lines up with Vatten's.
  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 1)
    .map((row) => row.location);

  return { recent, byLake };
}
