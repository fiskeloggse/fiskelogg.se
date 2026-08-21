import "server-only";
import sql from "./db";

// Locations grouped by the water they were logged with, so "Plats"
// suggestions can be narrowed to whatever "Vatten" is currently filled in.
// Catches with no lake set are grouped under the "" key.
export type LocationsByLake = Record<string, string[]>;

export async function getLocationSuggestions(
  userId: number
): Promise<LocationsByLake> {
  const rows = await sql<{ lake: string | null; location: string }[]>`
    select distinct lake, location from catches
    where user_id = ${userId} and location is not null and deleted_at is null
  `;

  const byLake: LocationsByLake = {};
  for (const row of rows) {
    const key = row.lake ?? "";
    (byLake[key] ??= []).push(row.location);
  }
  for (const locations of Object.values(byLake)) {
    locations.sort((a, b) => a.localeCompare(b, "sv"));
  }

  return byLake;
}
