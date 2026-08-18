import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import CatchForm from "@/app/components/catch-form";
import CatchList, { type Catch } from "@/app/components/catch-list";
import CatchViewSelect from "@/app/components/catch-view-select";
import CatchTabs from "@/app/components/catch-tabs";

const CATCHES_LIMIT = 5;
const TIMEZONE = "Europe/Stockholm";

export default async function Home(props: PageProps<"/">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;
  const view = searchParams.view === "today-longest" ? "today-longest" : "recent";

  const catches =
    view === "today-longest"
      ? await sql<Catch[]>`
          select id, species, length_cm, weight_kg, caught_at
          from catches
          where user_id = ${user.id}
            and length_cm is not null
            and (caught_at at time zone ${TIMEZONE})::date
              = (now() at time zone ${TIMEZONE})::date
          order by length_cm desc
          limit ${CATCHES_LIMIT}
        `
      : await sql<Catch[]>`
          select id, species, length_cm, weight_kg, caught_at
          from catches
          where user_id = ${user.id}
          order by caught_at desc
          limit ${CATCHES_LIMIT}
        `;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/" />

      <CatchForm />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {view === "today-longest" ? "Dagens 5 längsta" : "Mina 5 senaste fångster"}
          </h2>
          <CatchViewSelect />
        </div>
        <CatchList
          catches={catches}
          emptyMessage={
            view === "today-longest"
              ? "Inga fångster loggade idag än."
              : undefined
          }
        />
      </div>
    </main>
  );
}
