import "server-only";
import sql from "./db";
import type { Catch } from "@/app/components/catch-list";

export type Fiskepass = {
  id: number;
  user_id: number;
  team_id: number | null;
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
// automatically changes which catches it covers. A team pass counts any
// team member's catches in that window; a solo pass counts only the
// person who started it.
function catchCountSubquery() {
  return sql`(
    select count(*)::int from catches c
    join users u on u.id = c.user_id
    where c.deleted_at is null
      and c.caught_at >= fp.start_time
      and (fp.stop_time is null or c.caught_at <= fp.stop_time)
      and (
        (fp.team_id is not null and u.team_id = fp.team_id)
        or (fp.team_id is null and c.user_id = fp.user_id)
      )
  )`;
}

// Full catch rows (weather included) for one historical pass, opened from
// Register → Fiskepass -- joins on the same time-window + team/solo scope
// rule as catchCountSubquery instead of a stored foreign key.
export async function getFiskepassCatches(
  userId: number,
  passId: number
): Promise<Catch[]> {
  return sql<Catch[]>`
    select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location,
      c.method, c.bait, c.comment, c.caught_at, u.name as angler_name,
      c.latitude, c.longitude,
      c.weather_temp_c, c.weather_description, c.weather_wind_kmh, c.weather_wind_dir_deg,
      c.weather_pressure_hpa, c.weather_cloud_pct, c.photo_url
    from catches c
    join users u on u.id = c.user_id
    join fiskepass fp on c.caught_at >= fp.start_time
      and (fp.stop_time is null or c.caught_at <= fp.stop_time)
      and (
        (fp.team_id is not null and u.team_id = fp.team_id)
        or (fp.team_id is null and c.user_id = fp.user_id)
      )
    where fp.id = ${passId} and fp.user_id = ${userId} and c.deleted_at is null
    order by c.caught_at asc
  `;
}

// Your own open pass, or -- so a team pass reads the same to every member,
// not just whoever tapped "Starta" -- a teammate's still-open team pass.
export async function getOpenFiskepass(
  userId: number,
  teamId: number | null
): Promise<Fiskepass | null> {
  const [pass] = await sql<Fiskepass[]>`
    select id, user_id, team_id, target_species, start_time, stop_time, created_at
    from fiskepass
    where stop_time is null
      and (
        user_id = ${userId}
        or (team_id is not null and team_id = ${teamId})
      )
    order by start_time desc
    limit 1
  `;
  return pass ?? null;
}

// Matches the same two things a pass's own detail view would show: its
// målart, and the species/vatten of whatever was actually caught in it --
// mirrors getFilteredCatches' "art eller vatten" search on the Fångster tab.
function fiskepassSearchCondition(q: string) {
  if (!q) return sql``;
  // % and _ are LIKE wildcards — escape them so a literal search term
  // doesn't accidentally match more than typed.
  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  return sql`
    and (
      exists (
        select 1 from unnest(coalesce(fp.target_species, '{}'::text[])) t
        where t ilike ${pattern}
      )
      or exists (
        select 1 from catches c
        join users u on u.id = c.user_id
        where c.deleted_at is null
          and c.caught_at >= fp.start_time
          and (fp.stop_time is null or c.caught_at <= fp.stop_time)
          and (
            (fp.team_id is not null and u.team_id = fp.team_id)
            or (fp.team_id is null and c.user_id = fp.user_id)
          )
          and (c.species ilike ${pattern} or c.lake ilike ${pattern})
      )
    )
  `;
}

export async function getFiskepassHistory(
  userId: number,
  q: string = ""
): Promise<FiskepassWithCatchCount[]> {
  return sql<FiskepassWithCatchCount[]>`
    select fp.id, fp.user_id, fp.team_id, fp.target_species, fp.start_time, fp.stop_time, fp.created_at,
      ${catchCountSubquery()} as catch_count
    from fiskepass fp
    where fp.user_id = ${userId}
      ${fiskepassSearchCondition(q.trim())}
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

const CATCH_LIMIT = 5;

// Team pass -> any team member's catches; solo pass -> just the owner's.
function fiskepassScopeCondition(userId: number, teamId: number | null) {
  return teamId ? sql`u.team_id = ${teamId}` : sql`c.user_id = ${userId}`;
}

// While a pass is open, the home page swaps its usual "today" boxes for
// these -- scoped to the pass's own time window (which may span more or
// less than the current calendar day) rather than the clock.
export async function getFiskepassRecentCatches(
  userId: number,
  teamId: number | null,
  startTime: Date,
  speciesFilter: string
): Promise<Catch[]> {
  const speciesCondition = speciesFilter ? sql`and c.species = ${speciesFilter}` : sql``;

  return sql<Catch[]>`
    select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location, c.bait, c.comment, c.caught_at
    from catches c
    join users u on u.id = c.user_id
    where ${fiskepassScopeCondition(userId, teamId)}
      and c.deleted_at is null
      and c.caught_at >= ${startTime}
      ${speciesCondition}
    order by c.caught_at desc
    limit ${CATCH_LIMIT}
  `;
}

// Top 5 by length, restricted to an explicit species filter if given,
// otherwise to the pass's own target species (if any were set) -- "top 5 of
// the species you're after" is more useful mid-pass than "top 5 of
// anything".
export async function getFiskepassTopCatches(
  userId: number,
  teamId: number | null,
  startTime: Date,
  speciesFilter: string,
  targetSpecies: string[] | null
): Promise<Catch[]> {
  const speciesCondition = speciesFilter
    ? sql`and c.species = ${speciesFilter}`
    : targetSpecies && targetSpecies.length > 0
      ? sql`and c.species = any(${sql.array(targetSpecies)})`
      : sql``;

  return sql<Catch[]>`
    select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location, c.bait, c.comment, c.caught_at
    from catches c
    join users u on u.id = c.user_id
    where ${fiskepassScopeCondition(userId, teamId)}
      and c.deleted_at is null
      and c.length_cm is not null
      and c.caught_at >= ${startTime}
      ${speciesCondition}
    order by c.length_cm desc
    limit ${CATCH_LIMIT}
  `;
}

export async function getFiskepassSpeciesList(
  userId: number,
  teamId: number | null,
  startTime: Date
): Promise<string[]> {
  const rows = await sql<{ species: string }[]>`
    select distinct c.species
    from catches c
    join users u on u.id = c.user_id
    where ${fiskepassScopeCondition(userId, teamId)}
      and c.deleted_at is null
      and c.caught_at >= ${startTime}
    order by c.species
  `;
  return rows.map((r) => r.species);
}
