import "server-only";
import sql from "./db";

export type BingoCard = {
  id: number;
  species: string;
  min_cm: number;
  max_cm: number;
  team_id: number | null;
  created_by: number | null;
};

export type BingoCatch = {
  id: number;
  length_cm: number;
  weight_kg: number | null;
  caught_at: Date;
  angler_name: string;
};

export async function getBingoCards(
  userId: number,
  teamId: number | null
): Promise<BingoCard[]> {
  return sql<BingoCard[]>`
    select id, species, min_cm, max_cm, team_id, created_by
    from bingo_cards
    where (team_id is not null and team_id = ${teamId})
      or (team_id is null and created_by = ${userId})
    order by created_at desc
  `;
}

export async function getBingoCatches(
  card: BingoCard
): Promise<Map<number, BingoCatch[]>> {
  const rows = card.team_id
    ? await sql<(BingoCatch & { cm: number })[]>`
        select c.id, c.length_cm, c.weight_kg, c.caught_at, u.name as angler_name,
          round(c.length_cm)::int as cm
        from catches c
        join users u on u.id = c.user_id
        where u.team_id = ${card.team_id}
          and c.deleted_at is null
          and c.species = ${card.species}
          and c.length_cm is not null
          and round(c.length_cm) between ${card.min_cm} and ${card.max_cm}
        order by c.length_cm asc, c.caught_at asc
      `
    : await sql<(BingoCatch & { cm: number })[]>`
        select c.id, c.length_cm, c.weight_kg, c.caught_at, u.name as angler_name,
          round(c.length_cm)::int as cm
        from catches c
        join users u on u.id = c.user_id
        where c.user_id = ${card.created_by}
          and c.deleted_at is null
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

// Bingo cards visible to a catch's logger that this new catch could complete
// a cell on — used to notify right after logging.
export async function findMatchingBingoCards(
  userId: number,
  teamId: number | null,
  species: string,
  lengthCm: number
): Promise<{ id: number; species: string; min_cm: number; max_cm: number }[]> {
  return sql<{ id: number; species: string; min_cm: number; max_cm: number }[]>`
    select id, species, min_cm, max_cm
    from bingo_cards
    where species = ${species}
      and min_cm <= ${lengthCm}
      and max_cm >= ${lengthCm}
      and (
        (team_id is not null and team_id = ${teamId})
        or (team_id is null and created_by = ${userId})
      )
  `;
}
