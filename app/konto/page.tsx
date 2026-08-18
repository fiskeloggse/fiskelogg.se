import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getTeamMembers } from "@/lib/team";
import { logout } from "@/app/actions/auth";
import { leaveTeam } from "@/app/actions/team";
import CatchTabs from "@/app/components/catch-tabs";
import InviteForm from "@/app/components/invite-form";

export const metadata: Metadata = {
  title: "Konto – Fisklogg",
};

export default async function KontoPage() {
  const user = await requireUser();
  const teamMembers = user.team_id ? await getTeamMembers(user.team_id) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/konto" />

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <div>
          <h2 className="text-lg font-semibold">Konto</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user.name} · {user.email}
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Logga ut
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Team</h2>

        {teamMembers.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {teamMembers.map((member) => (
              <li key={member.id}>
                {member.name}
                {member.id === user.id && " (du)"}
                <span className="text-zinc-500 dark:text-zinc-400">
                  {" "}
                  · {member.email}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Du har inget team än. Bjud in någon nedan för att dela fångster.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Bjud in ett konto
          </label>
          <InviteForm />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Personen måste redan ha ett konto på Fisklogg.
          </p>
        </div>

        {user.team_id && (
          <form action={leaveTeam}>
            <button
              type="submit"
              className="text-sm text-red-600 underline dark:text-red-400"
            >
              Lämna teamet
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
