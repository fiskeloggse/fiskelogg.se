import sql from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import { getBaitSuggestions } from "@/lib/bait-suggestions";
import { getLakeSuggestions } from "@/lib/lake-suggestions";
import { getLocationSuggestions } from "@/lib/location-suggestions";
import { getMethodSuggestions } from "@/lib/method-suggestions";
import { getTeamMembers, getTeamName } from "@/lib/team";
import {
  getTodaysLastLake,
  getTodaysLastBait,
  getTodaysLastMethod,
} from "@/lib/catches";
import { TIMEZONE } from "@/lib/constants";
import CatchForm from "@/app/components/catch-form";
import CatchList, { type Catch } from "@/app/components/catch-list";
import CatchSpeciesFilter from "@/app/components/catch-species-filter";
import LandingPage from "@/app/components/landing-page";
import TodayTopTable from "@/app/components/today-top-table";

const CATCHES_LIMIT = 5;

export default async function Home(props: PageProps<"/">) {
  const user = await getCurrentUser();
  if (!user) {
    return <LandingPage />;
  }

  const searchParams = await props.searchParams;
  const speciesFilter =
    typeof searchParams.species === "string" ? searchParams.species : "";

  const speciesCondition = speciesFilter
    ? sql`and species = ${speciesFilter}`
    : sql``;
  const teamSpeciesCondition = speciesFilter
    ? sql`and c.species = ${speciesFilter}`
    : sql``;

  const personalCatchesQuery = sql<Catch[]>`
    select id, user_id, species, length_cm, weight_kg, lake, location, bait, comment, caught_at
    from catches
    where user_id = ${user.id}
      and deleted_at is null
      ${speciesCondition}
    order by caught_at desc
    limit ${CATCHES_LIMIT}
  `;

  const teamCatchesQuery = !user.team_id
    ? Promise.resolve([] as Catch[])
    : sql<Catch[]>`
        select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location, c.bait, c.comment, c.caught_at,
          u.name as angler_name
        from catches c
        join users u on u.id = c.user_id
        where u.team_id = ${user.team_id}
          and c.deleted_at is null
          ${teamSpeciesCondition}
        order by c.caught_at desc
        limit ${CATCHES_LIMIT}
      `;

  const todaysTopCatchesQuery = sql<Catch[]>`
    select id, user_id, species, length_cm, weight_kg, lake, location, bait, comment, caught_at
    from catches
    where user_id = ${user.id}
      and deleted_at is null
      and length_cm is not null
      and (caught_at at time zone ${TIMEZONE})::date
        = (now() at time zone ${TIMEZONE})::date
      ${speciesCondition}
    order by length_cm desc
    limit ${CATCHES_LIMIT}
  `;

  const todaysTopTeamCatchesQuery = !user.team_id
    ? Promise.resolve([] as Catch[])
    : sql<Catch[]>`
        select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location, c.bait, c.comment, c.caught_at,
          u.name as angler_name
        from catches c
        join users u on u.id = c.user_id
        where u.team_id = ${user.team_id}
          and c.deleted_at is null
          and c.length_cm is not null
          and (c.caught_at at time zone ${TIMEZONE})::date
            = (now() at time zone ${TIMEZONE})::date
          ${teamSpeciesCondition}
        order by c.length_cm desc
        limit ${CATCHES_LIMIT}
      `;

  // Independent queries — run together instead of one round trip at a time.
  const [
    speciesSuggestions,
    baitSuggestions,
    lakeSuggestions,
    locationSuggestions,
    methodSuggestions,
    teamMembers,
    teamName,
    defaultLake,
    defaultBait,
    defaultMethod,
    todaysTopCatches,
    todaysTopTeamCatches,
    personalCatches,
    teamCatches,
  ] = await Promise.all([
    getSpeciesSuggestions(user.id),
    getBaitSuggestions(user.id),
    getLakeSuggestions(user.id),
    getLocationSuggestions(user.id),
    getMethodSuggestions(user.id),
    user.team_id ? getTeamMembers(user.team_id) : Promise.resolve([]),
    user.team_id ? getTeamName(user.team_id) : Promise.resolve(null),
    getTodaysLastLake(user.id, user.team_id),
    getTodaysLastBait(user.id, user.team_id),
    getTodaysLastMethod(user.id, user.team_id),
    todaysTopCatchesQuery,
    todaysTopTeamCatchesQuery,
    personalCatchesQuery,
    teamCatchesQuery,
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <CatchForm
        suggestions={speciesSuggestions}
        baitSuggestions={baitSuggestions}
        lakeSuggestions={lakeSuggestions}
        locationSuggestions={locationSuggestions}
        methodSuggestions={methodSuggestions}
        currentUserId={user.id}
        currentUserName={user.name}
        teamMembers={teamMembers}
        defaultLake={defaultLake}
        defaultBait={defaultBait}
        defaultMethod={defaultMethod}
        quickLogFields={user.quick_log_fields}
        gpsDefaultEnabled={user.gps_default_enabled}
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Dagens topp 5</h2>
        <TodayTopTable
          personalCatches={todaysTopCatches}
          teamCatches={user.team_id ? todaysTopTeamCatches : null}
          teamName={teamName || "Team"}
          currentUserId={user.id}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Senaste</h2>
          <CatchSpeciesFilter species={speciesSuggestions.all} />
        </div>
        {user.team_id ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Du
              </h3>
              <CatchList catches={personalCatches} currentUserId={user.id} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {teamName || "Team"}
              </h3>
              <CatchList catches={teamCatches} currentUserId={user.id} />
            </div>
          </div>
        ) : (
          <CatchList catches={personalCatches} currentUserId={user.id} />
        )}
      </div>
    </main>
  );
}
