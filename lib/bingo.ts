import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

export type BingoCard = {
  id: number;
  species: string;
  min_cm: number;
  max_cm: number;
  team_id: number | null;
  created_by: number | null;
  from_date: Date | null;
  to_date: Date | null;
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
    select id, species, min_cm, max_cm, team_id, created_by, from_date, to_date
    from bingo_cards
    where (team_id is not null and team_id = ${teamId})
      or (team_id is null and created_by = ${userId})
    order by created_at desc
  `;
}

export async function getBingoCatches(
  card: BingoCard
): Promise<Map<number, BingoCatch[]>> {
  const scopeCondition = card.team_id
    ? sql`u.team_id = ${card.team_id}`
    : sql`c.user_id = ${card.created_by}`;
  const dateCondition =
    card.from_date && card.to_date
      ? sql`and (c.caught_at at time zone ${TIMEZONE})::date between ${card.from_date}::date and ${card.to_date}::date`
      : sql``;

  const rows = await sql<(BingoCatch & { cm: number })[]>`
    select c.id, c.length_cm, c.weight_kg, c.caught_at, u.name as angler_name,
      round(c.length_cm)::int as cm
    from catches c
    join users u on u.id = c.user_id
    where ${scopeCondition}
      and c.deleted_at is null
      and c.species = ${card.species}
      and c.length_cm is not null
      and round(c.length_cm) between ${card.min_cm} and ${card.max_cm}
      ${dateCondition}
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

// Bingo cards visible to a catch's logger that this new catch newly
// completes a cell on -- excludes cards where that same cm cell was
// already checked off by an earlier catch, so a second 90cm catch doesn't
// re-announce a bingo match the first 90cm catch already claimed. Used to
// notify right after logging.
export async function findMatchingBingoCards(
  userId: number,
  teamId: number | null,
  species: string,
  lengthCm: number,
  caughtAt: Date,
  excludeCatchId: number
): Promise<{ id: number; species: string; min_cm: number; max_cm: number }[]> {
  return sql<{ id: number; species: string; min_cm: number; max_cm: number }[]>`
    select bc.id, bc.species, bc.min_cm, bc.max_cm
    from bingo_cards bc
    where bc.species = ${species}
      and bc.min_cm <= ${lengthCm}
      and bc.max_cm >= ${lengthCm}
      and (bc.from_date is null or (${caughtAt}::timestamptz at time zone ${TIMEZONE})::date >= bc.from_date)
      and (bc.to_date is null or (${caughtAt}::timestamptz at time zone ${TIMEZONE})::date <= bc.to_date)
      and (
        (bc.team_id is not null and bc.team_id = ${teamId})
        or (bc.team_id is null and bc.created_by = ${userId})
      )
      and not exists (
        select 1
        from catches c2
        join users u2 on u2.id = c2.user_id
        where c2.deleted_at is null
          and c2.id <> ${excludeCatchId}
          and c2.species = ${species}
          and c2.length_cm is not null
          and round(c2.length_cm) = round(${lengthCm}::numeric)
          and (
            (bc.team_id is not null and u2.team_id = bc.team_id)
            or (bc.team_id is null and c2.user_id = bc.created_by)
          )
          and (bc.from_date is null or (c2.caught_at at time zone ${TIMEZONE})::date >= bc.from_date)
          and (bc.to_date is null or (c2.caught_at at time zone ${TIMEZONE})::date <= bc.to_date)
      )
  `;
}
