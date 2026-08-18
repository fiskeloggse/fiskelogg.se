import Link from "next/link";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import CatchForm from "@/app/components/catch-form";
import CatchList, { type Catch } from "@/app/components/catch-list";
import CatchViewSelect from "@/app/components/catch-view-select";
import CatchTabs from "@/app/components/catch-tabs";

const CATCHES_LIMIT = 5;
const TIMEZONE = "Europe/Stockholm";

function totalLength(catches: Catch[]) {
  return catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
}

export default async function Home(props: PageProps<"/">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const view = searchParams.view === "today-longest" ? "today-longest" : "recent";

  const speciesSuggestions = await getSpeciesSuggestions(user.id);

  const personalCatches =
    view === "today-longest"
      ? await sql<Catch[]>`
          select id, user_id, species, length_cm, weight_kg, caught_at
          from catches
          where user_id = ${user.id}
            and length_cm is not null
            and (caught_at at time zone ${TIMEZONE})::date
              = (now() at time zone ${TIMEZONE})::date
          order by length_cm desc
          limit ${CATCHES_LIMIT}
        `
      : await sql<Catch[]>`
          select id, user_id, species, length_cm, weight_kg, caught_at
          from catches
          where user_id = ${user.id}
          order by caught_at desc
          limit ${CATCHES_LIMIT}
        `;

  const teamCatches = user.team_id
    ? view === "today-longest"
      ? await sql<Catch[]>`
          select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.caught_at,
            u.name as angler_name
          from catches c
          join users u on u.id = c.user_id
          where u.team_id = ${user.team_id}
            and c.length_cm is not null
            and (c.caught_at at time zone ${TIMEZONE})::date
              = (now() at time zone ${TIMEZONE})::date
          order by c.length_cm desc
          limit ${CATCHES_LIMIT}
        `
      : await sql<Catch[]>`
          select c.id, c.user_id, c.species, c.length_cm, c.weight_kg, c.caught_at,
            u.name as angler_name
          from catches c
          join users u on u.id = c.user_id
          where u.team_id = ${user.team_id}
          order by c.caught_at desc
          limit ${CATCHES_LIMIT}
        `
    : [];

  const heading =
    view === "today-longest" ? "Dagens 5 längsta" : "Mina 5 senaste fångster";
  const emptyMessage =
    view === "today-longest" ? "Inga fångster loggade idag än." : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/" />

      <CatchForm suggestions={speciesSuggestions} />

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{heading}</h2>
        <CatchViewSelect />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Du
          </h3>
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
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Team
          </h3>
          {user.team_id ? (
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
