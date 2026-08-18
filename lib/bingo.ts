import "server-only";
import sql from "./db";

export type BingoCard = {
  id: number;
  species: string;
  min_cm: number;
  max_cm: number;
};

export type BingoCatch = {
  id: number;
  length_cm: number;
  weight_kg: number | null;
  caught_at: Date;
  angler_name: string;
};

export async function getBingoCards(teamId: number): Promise<BingoCard[]> {
  return sql<BingoCard[]>`
    select id, species, min_cm, max_cm
    from bingo_cards
    where team_id = ${teamId}
    order by created_at desc
  `;
}

export async function getBingoCatches(
  teamId: number,
  card: BingoCard
): Promise<Map<number, BingoCatch[]>> {
  const rows = await sql<(BingoCatch & { cm: number })[]>`
    select c.id, c.length_cm, c.weight_kg, c.caught_at, u.name as angler_name,
      round(c.length_cm)::int as cm
    from catches c
    join users u on u.id = c.user_id
    where u.team_id = ${teamId}
      and c.species = ${card.species}
      and c.length_cm is not null
      and round(c.length_cm) between ${card.min_cm} and ${card.max_cm}
    order by c.length_cm asc, c.caught_at asc
  `;

  const byCm = new Map<number, BingoCatch[]>();
  for (const { cm, ...catchRow } of rows) {
    const list = byCm.get(cm);
    if (list) {
      list.push(catchRow);
    } else {
      byCm.set(cm, [catchRow]);
    }
  }
  return byCm;
}
