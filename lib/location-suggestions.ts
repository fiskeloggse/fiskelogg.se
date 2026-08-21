import "server-only";
import sql from "./db";

export async function getLocationSuggestions(userId: number): Promise<string[]> {
  const rows = await sql<{ location: string }[]>`
    select distinct location from catches
    where user_id = ${userId} and location is not null and deleted_at is null
    order by location
  `;
  return rows.map((row) => row.location);
}
