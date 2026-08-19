import "server-only";
import sql from "./db";
import { TIMEZONE } from "./constants";

function scopeCondition(userId: number, teamId: number | null) {
  return teamId
    ? sql`c.user_id in (select id from users where team_id = ${teamId})`
    : sql`c.user_id = ${userId}`;
}

export type StatsTotals = {
  catches: number;
  species: number;
  totalLengthCm: number;
  totalWeightKg: number;
};

export async function getStatsTotals(
  userId: number,
  teamId: number | null
): Promise<StatsTotals> {
  const [row] = await sql<
    {
      catches: number;
      species: number;
      total_length_cm: number;
      total_weight_kg: number;
    }[]
  >`
    select
      count(*)::int as catches,
      count(distinct species)::int as species,
      coalesce(sum(length_cm), 0)::real as total_length_cm,
      coalesce(sum(weight_kg), 0)::real as total_weight_kg
    from catches c
    where ${scopeCondition(userId, teamId)}
  `;
  return {
    catches: row.catches,
    species: row.species,
    totalLengthCm: row.total_length_cm,
    totalWeightKg: row.total_weight_kg,
  };
}

export type StatsSpeciesRow = {
  species: string;
  count: number;
  avgLengthCm: number | null;
  avgWeightKg: number | null;
  maxLengthCm: number | null;
};

export async function getStatsPerSpecies(
  userId: number,
  teamId: number | null
): Promise<StatsSpeciesRow[]> {
  const rows = await sql<
    {
      species: string;
      count: number;
      avg_length_cm: number | null;
      avg_weight_kg: number | null;
      max_length_cm: number | null;
    }[]
  >`
    select
      species,
      count(*)::int as count,
      round(avg(length_cm)::numeric, 1)::float as avg_length_cm,
      round(avg(weight_kg)::numeric, 2)::float as avg_weight_kg,
      max(length_cm) as max_length_cm
    from catches c
    where ${scopeCondition(userId, teamId)}
    group by species
    order by count desc
  `;
  return rows.map((r) => ({
    species: r.species,
    count: r.count,
    avgLengthCm: r.avg_length_cm,
    avgWeightKg: r.avg_weight_kg,
    maxLengthCm: r.max_length_cm,
  }));
}

export type StatsMonthRow = { month: number; count: number };

export async function getStatsMonthly(
  userId: number,
  teamId: number | null
): Promise<StatsMonthRow[]> {
  const rows = await sql<{ month: number; count: number }[]>`
    select
      extract(month from (caught_at at time zone ${TIMEZONE}))::int as month,
      count(*)::int as count
    from catches c
    where ${scopeCondition(userId, teamId)}
      and extract(year from (caught_at at time zone ${TIMEZONE}))
        = extract(year from now() at time zone ${TIMEZONE})
    group by month
    order by month
  `;
  const byMonth = new Map(rows.map((r) => [r.month, r.count]));
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    count: byMonth.get(i + 1) ?? 0,
  }));
}

export type StatsLakeRow = { lake: string; count: number };

export async function getStatsPerLake(
  userId: number,
  teamId: number | null
): Promise<StatsLakeRow[]> {
  return sql<StatsLakeRow[]>`
    select lake, count(*)::int as count
    from catches c
    where ${scopeCondition(userId, teamId)}
      and lake is not null and lake <> ''
    group by lake
    order by count desc
    limit 10
  `;
}

export type StatsTop5Catch = {
  lengthCm: number;
  weightKg: number | null;
  caughtAt: string;
  anglerName: string;
};

export type StatsTop5SpeciesRow = {
  species: string;
  catches: StatsTop5Catch[];
};

export async function getStatsTop5PerSpecies(
  userId: number,
  teamId: number | null
): Promise<StatsTop5SpeciesRow[]> {
  const rows = await sql<
    {
      species: string;
      length_cm: number;
      weight_kg: number | null;
      caught_at: string;
      angler_name: string;
    }[]
  >`
    select species, length_cm, weight_kg, caught_at, angler_name
    from (
      select
        c.species,
        c.length_cm,
        c.weight_kg,
        c.caught_at,
        u.name as angler_name,
        row_number() over (
          partition by c.species
          order by c.length_cm desc nulls last, c.caught_at desc
        ) as rn
      from catches c
      join users u on u.id = c.user_id
      where ${scopeCondition(userId, teamId)}
        and c.length_cm is not null
    ) ranked
    where rn <= 5
    order by species, length_cm desc
  `;

  const bySpecies = new Map<string, StatsTop5SpeciesRow>();
  for (const r of rows) {
    if (!bySpecies.has(r.species)) {
      bySpecies.set(r.species, { species: r.species, catches: [] });
    }
    bySpecies.get(r.species)!.catches.push({
      lengthCm: r.length_cm,
      weightKg: r.weight_kg,
      caughtAt: r.caught_at,
      anglerName: r.angler_name,
    });
  }
  return Array.from(bySpecies.values());
}

export type StatsLeaderboardRow = {
  userId: number;
  name: string;
  count: number;
  maxLengthCm: number | null;
  speciesCount: number;
};

export async function getStatsLeaderboard(
  teamId: number
): Promise<StatsLeaderboardRow[]> {
  const rows = await sql<
    {
      user_id: number;
      name: string;
      count: number;
      max_length_cm: number | null;
      species_count: number;
    }[]
  >`
    select
      u.id as user_id,
      u.name,
      count(c.id)::int as count,
      max(c.length_cm) as max_length_cm,
      count(distinct c.species)::int as species_count
    from users u
    left join catches c on c.user_id = u.id
    where u.team_id = ${teamId}
    group by u.id, u.name
    order by count desc, u.name
  `;
  return rows.map((r) => ({
    userId: r.user_id,
    name: r.name,
    count: r.count,
    maxLengthCm: r.max_length_cm,
    speciesCount: r.species_count,
  }));
}

export async function getStatsStreak(
  userId: number,
  teamId: number | null
): Promise<number> {
  const rows = await sql<{ d: string }[]>`
    select distinct (caught_at at time zone ${TIMEZONE})::date as d
    from catches c
    where ${scopeCondition(userId, teamId)}
    order by d
  `;
  if (rows.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].d);
    const curr = new Date(rows[i].d);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

export type StatsBestDay = { date: string; count: number } | null;

export async function getStatsBestDay(
  userId: number,
  teamId: number | null
): Promise<StatsBestDay> {
  const [row] = await sql<{ date: string; count: number }[]>`
    select (caught_at at time zone ${TIMEZONE})::date as date, count(*)::int as count
    from catches c
    where ${scopeCondition(userId, teamId)}
    group by date
    order by count desc, date desc
    limit 1
  `;
  return row ?? null;
}
