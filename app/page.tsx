import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import CatchForm from "@/app/components/catch-form";
import CatchList, { type Catch } from "@/app/components/catch-list";

const RECENT_CATCHES_LIMIT = 5;

export default async function Home() {
  const user = await requireUser();

  const catches = await sql<Catch[]>`
    select id, species, length_cm, weight_kg, caught_at
    from catches
    where user_id = ${user.id}
    order by caught_at desc
    limit ${RECENT_CATCHES_LIMIT}
  `;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Mina {RECENT_CATCHES_LIMIT} senaste fångster
        </h2>
        <CatchList catches={catches} />
      </div>
    </main>
  );
}
