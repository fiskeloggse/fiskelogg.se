import "server-only";
import sql from "./db";

export type Fiskepass = {
  id: number;
  user_id: number;
  target_species: string[] | null;
  start_time: Date;
  stop_time: Date | null;
  created_at: Date;
};

export type FiskepassWithCatchCount = Fiskepass & { catch_count: number };

export type FiskepassStats = {
  antalPass: number;
  antalBompass: number;
  totalHours: number;
};

// A catch "belongs" to a pass purely by falling inside its time window --
// no foreign key on catches, so editing a pass's start/stop time
// automatically changes which catches it covers.
function catchCountSubquery() {
  return sql`(
    select count(*)::int from catches c
    where c.user_id = fp.user_id
      and c.deleted_at is null
      and c.caught_at >= fp.start_time
      and (fp.stop_time is null or c.caught_at <= fp.stop_time)
  )`;
}

export async function getOpenFiskepass(
  userId: number
): Promise<Fiskepass | null> {
  const [pass] = await sql<Fiskepass[]>`
    select id, user_id, target_species, start_time, stop_time, created_at
    from fiskepass
    where user_id = ${userId} and stop_time is null
  `;
  return pass ?? null;
}

export async function getFiskepassHistory(
  userId: number
): Promise<FiskepassWithCatchCount[]> {
  return sql<FiskepassWithCatchCount[]>`
    select fp.id, fp.user_id, fp.target_species, fp.start_time, fp.stop_time, fp.created_at,
      ${catchCountSubquery()} as catch_count
    from fiskepass fp
    where fp.user_id = ${userId}
    order by fp.start_time desc
  `;
}

export async function getFiskepassStats(userId: number): Promise<FiskepassStats> {
  const [row] = await sql<
    { antal_pass: number; antal_bompass: number; total_seconds: number }[]
  >`
    with pass_catches as (
      select fp.start_time, fp.stop_time, ${catchCountSubquery()} as catch_count
      from fiskepass fp
      where fp.user_id = ${userId} and fp.stop_time is not null
    )
    select
      count(*)::int as antal_pass,
      count(*) filter (where catch_count = 0)::int as antal_bompass,
      coalesce(sum(extract(epoch from (stop_time - start_time))), 0)::float as total_seconds
    from pass_catches
  `;

  return {
    antalPass: row?.antal_pass ?? 0,
    antalBompass: row?.antal_bompass ?? 0,
    totalHours: (row?.total_seconds ?? 0) / 3600,
  };
}
