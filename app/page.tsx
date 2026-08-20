import Link from "next/link";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import { getBaitSuggestions } from "@/lib/bait-suggestions";
import { getTeamMembers, getTeamName } from "@/lib/team";
import { getTodaysLastLake, getTodaysLastBait } from "@/lib/catches";
import CatchForm from "@/app/components/catch-form";
import CatchList, { type Catch } from "@/app/components/catch-list";
import CompactLengthList from "@/app/components/compact-length-list";
import CatchViewSelect from "@/app/components/catch-view-select";
import CatchSpeciesFilter from "@/app/components/catch-species-filter";
import { TIMEZONE } from "@/lib/constants";

const CATCHES_LIMIT = 5;

function totalLength(catches: Catch[]) {
  return catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
}

export default async function Home(props: PageProps<"/">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const view = searchParams.view === "today-longest" ? "today-longest" : "recent";
  const speciesFilter =
    typeof searchParams.species === "string" ? searchParams.species : "";

  const speciesCondition = speciesFilter
    ? sql`and species = ${speciesFilter}`
    : sql``;
  const teamSpeciesCondition = speciesFilter
    ? sql`and c.species = ${speciesFilter}`
    : sql``;

  const personalCatchesQuery =
    view === "today-longest"
      ? sql<Catch[]>`
          select id, user_id, species, length_cm, weight_kg, lake, location, bait, caught_at
          from catches
          where user_id = ${user.id}
            and deleted_at is null
            and length_cm is not null
            and (caught_at at time zone ${TIMEZONE})::date
              = (now() at time zone ${TIMEZONE})::date
            ${speciesCondition}
          order by length_cm desc
          limit ${CATCHES_LIMIT}
        `
      : sql<Catch[]>`
          select id, user_id, species, length_cm, weight_kg, lake, location, bait, caught_at
          from catches
          where user_id = ${user.id}
            and deleted_at is null
            ${speciesCondition}
          order by caught_at desc
          limit ${CATCHES_LIMIT}
        `;

  const teamCatchesQuery = !user.team_id
    ? Promise.resolve([] as Catch[])
    : view === "today-longest"
      ? sql<Catch[]>`
          select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location, c.bait, c.caught_at,
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
        `
      : sql<Catch[]>`
          select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.lake, c.location, c.bait, c.caught_at,
            u.name as angler_name
          from catches c
          join users u on u.id = c.user_id
          where u.team_id = ${user.team_id}
            and c.deleted_at is null
            ${teamSpeciesCondition}
          order by c.caught_at desc
          limit ${CATCHES_LIMIT}
        `;

  // Independent queries — run together instead of one round trip at a time.
  const [
    speciesSuggestions,
    baitSuggestions,
    teamMembers,
    teamName,
    defaultLake,
    defaultBait,
    personalCatches,
    teamCatches,
  ] = await Promise.all([
    getSpeciesSuggestions(user.id),
    getBaitSuggestions(user.id),
    user.team_id ? getTeamMembers(user.team_id) : Promise.resolve([]),
    user.team_id ? getTeamName(user.team_id) : Promise.resolve(null),
    getTodaysLastLake(user.id, user.team_id),
    getTodaysLastBait(user.id, user.team_id),
    personalCatchesQuery,
    teamCatchesQuery,
  ]);

  const heading = view === "today-longest" ? "Dagens 5 längsta" : "5 senaste";
  const emptyMessage =
    view === "today-longest" ? "Inga fångster loggade idag än." : undefined;
  const showCompact = view === "today-longest" && Boolean(speciesFilter);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <CatchForm
        suggestions={speciesSuggestions}
        baitSuggestions={baitSuggestions}
        currentUserId={user.id}
        currentUserName={user.name}
        teamMembers={teamMembers}
        defaultLake={defaultLake}
        defaultBait={defaultBait}
        quickLogFields={user.quick_log_fields}
        gpsDefaultEnabled={user.gps_default_enabled}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{heading}</h2>
        <div className="flex items-center gap-2">
          <CatchSpeciesFilter species={speciesSuggestions.all} />
          <CatchViewSelect />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Du
          </h3>
          {showCompact ? (
            <CompactLengthList catches={personalCatches} emptyMessage={emptyMessage} />
          ) : (
            <>
              <CatchList
                catches={personalCatches}
                currentUserId={user.id}
                emptyMessage={emptyMessage}
              />
              {view === "today-longest" && personalCatches.length > 0 && (
                <p className="text-sm font-medium">
                  Totalt: {totalLength(personalCatches)} cm
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {teamName || "Team"}
          </h3>
          {user.team_id ? (
            showCompact ? (
              <CompactLengthList catches={teamCatches} emptyMessage={emptyMessage} />
            ) : (
              <>
                <CatchList
                  catches={teamCatches}
                  currentUserId={user.id}
                  emptyMessage={emptyMessage}
                />
                {view === "today-longest" && teamCatches.length > 0 && (
                  <p className="text-sm font-medium">
                    Totalt: {totalLength(teamCatches)} cm
                  </p>
                )}
              </>
            )
          ) : (
            <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              Inget team än.{" "}
              <Link href="/konto" className="underline">
                Bjud in någon
              </Link>{" "}
              för att dela fångster.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
