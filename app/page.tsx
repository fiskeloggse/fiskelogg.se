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
import {
  getFiskepassRecentCatches,
  getFiskepassSpeciesList,
  getFiskepassTopCatches,
  getOpenFiskepass,
} from "@/lib/fiskepass";
import CatchForm from "@/app/components/catch-form";
import type { Catch } from "@/app/components/catch-list";
import CatchSpeciesFilter from "@/app/components/catch-species-filter";
import FiskepassButton, { FiskepassStatus } from "@/app/components/fiskepass-bar";
import LandingPage from "@/app/components/landing-page";
import CatchesTable from "@/app/components/catches-table";

const CATCHES_LIMIT = 5;

export default async function Home(props: PageProps<"/">) {
  const user = await getCurrentUser();
  if (!user) {
    return <LandingPage />;
  }

  const searchParams = await props.searchParams;
  const speciesFilter =
    typeof searchParams.species === "string" ? searchParams.species : "";

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
    openFiskepass,
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
    user.show_fiskepass ? getOpenFiskepass(user.id) : Promise.resolve(null),
  ]);

  // While a pass is open, the two catch boxes below switch from "today" to
  // "this pass" — a pass can span less or more than a calendar day, and the
  // top-5 box narrows to the pass's target species instead of anything.
  let topTitle = "Dagens topp 5";
  let recentTitle = "Senaste";
  let topCatches: Catch[];
  let recentCatches: Catch[];
  let topTeamCatches: Catch[] | null = null;
  let recentTeamCatches: Catch[] | null = null;
  let topSpeciesOptions: string[];
  let recentSpeciesOptions: string[];

  if (openFiskepass) {
    topTitle = "Topp 5 i passet";
    recentTitle = "Senaste i passet";
    let sharedSpeciesOptions: string[];
    [topCatches, recentCatches, sharedSpeciesOptions] = await Promise.all([
      getFiskepassTopCatches(
        user.id,
        openFiskepass.start_time,
        speciesFilter,
        openFiskepass.target_species
      ),
      getFiskepassRecentCatches(user.id, openFiskepass.start_time, speciesFilter),
      getFiskepassSpeciesList(user.id, openFiskepass.start_time),
    ]);
    topSpeciesOptions = sharedSpeciesOptions;
    recentSpeciesOptions = sharedSpeciesOptions;
  } else {
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

    const todaysSpeciesQuery = sql<{ species: string }[]>`
      select distinct species
      from catches c
      where (
        c.user_id = ${user.id}
        ${user.team_id ? sql`or c.user_id in (select id from users where team_id = ${user.team_id})` : sql``}
      )
        and c.deleted_at is null
        and (c.caught_at at time zone ${TIMEZONE})::date
          = (now() at time zone ${TIMEZONE})::date
      order by species
    `;

    const [
      todaysSpeciesRows,
      todaysTopCatches,
      todaysTopTeamCatches,
      personalCatches,
      teamCatches,
    ] = await Promise.all([
      todaysSpeciesQuery,
      todaysTopCatchesQuery,
      todaysTopTeamCatchesQuery,
      personalCatchesQuery,
      teamCatchesQuery,
    ]);

    topCatches = todaysTopCatches;
    recentCatches = personalCatches;
    topTeamCatches = user.team_id ? todaysTopTeamCatches : null;
    recentTeamCatches = user.team_id ? teamCatches : null;
    topSpeciesOptions = todaysSpeciesRows.map((row) => row.species);
    recentSpeciesOptions = speciesSuggestions.all;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      {user.show_fiskepass && <FiskepassStatus openPass={openFiskepass} />}

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
        gpsMode={user.gps_mode}
        openFiskepassSpecies={openFiskepass?.target_species ?? null}
        fiskepassButton={
          user.show_fiskepass ? <FiskepassButton openPass={openFiskepass} /> : null
        }
      />

      <CatchesTable
        title={topTitle}
        headerExtra={<CatchSpeciesFilter species={topSpeciesOptions} />}
        personalCatches={topCatches}
        teamCatches={topTeamCatches}
        teamName={teamName || "Team"}
        currentUserId={user.id}
        showTotal
      />

      <CatchesTable
        title={recentTitle}
        headerExtra={<CatchSpeciesFilter species={recentSpeciesOptions} />}
        personalCatches={recentCatches}
        teamCatches={recentTeamCatches}
        teamName={teamName || "Team"}
        currentUserId={user.id}
      />
    </main>
  );
}
