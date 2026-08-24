import "server-only";
import sql from "./db";

export type MethodSuggestions = {
  recent: string[];
  all: string[];
};

export async function getMethodSuggestions(
  userId: number
): Promise<MethodSuggestions> {
  const rows = await sql<
    { method: string; last_caught: Date }[]
  >`
    select method, max(caught_at) as last_caught
    from catches
    where user_id = ${userId} and method is not null and deleted_at is null
    group by method
  `;

  const recent = [...rows]
    .sort((a, b) => b.last_caught.getTime() - a.last_caught.getTime())
    .slice(0, 1)
    .map((row) => row.method);

  const all = rows
    .map((row) => row.method)
    .sort((a, b) => a.localeCompare(b, "sv"));

  return { recent, all };
}
