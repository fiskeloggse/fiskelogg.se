import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { getTeamByInviteToken } from "@/lib/team";
import { joinTeamByToken, redirectToAuthWithPendingInvite } from "@/app/actions/team";

export const metadata: Metadata = {
  title: "Gå med i team – Fisklogg",
};

export default async function JoinTeamPage(props: PageProps<"/join/[token]">) {
  const { token } = await props.params;
  const [team, user] = await Promise.all([
    getTeamByInviteToken(token),
    getCurrentUser(),
  ]);

  if (!team) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Länken fungerar inte</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Den här inbjudningslänken är ogiltig eller har ersatts av en ny. Be
          personen som bjöd in dig om en aktuell länk.
        </p>
        <Link href="/" className="text-sm underline">
          Till Fisklogg
        </Link>
      </main>
    );
  }

  const teamLabel = team.name || "teamet";

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
        <h1 className="text-xl font-semibold">Gå med i {teamLabel} på Fisklogg</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Skapa ett konto eller logga in för att gå med — du hamnar i teamet
          direkt efteråt.
        </p>
        <form action={redirectToAuthWithPendingInvite}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="dest" value="signup" />
          <button
            type="submit"
            className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Skapa konto
          </button>
        </form>
        <form action={redirectToAuthWithPendingInvite}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="dest" value="login" />
          <button
            type="submit"
            className="w-full rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Jag har redan ett konto
          </button>
        </form>
      </main>
    );
  }

  if (user.team_id === team.id) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Du är redan med</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Du är redan medlem i {teamLabel}.
        </p>
        <Link href="/konto" className="text-sm underline">
          Till Konto
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-xl font-semibold">Gå med i {teamLabel}?</h1>
      {user.team_id ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Du är redan med i ett annat team. Går du med här lämnar du det
          automatiskt.
        </p>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ni kommer se varandras fångster på startsidan och kan tävla
          tillsammans i Utmaningar.
        </p>
      )}
      <form action={joinTeamByToken} className="flex flex-col gap-2">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="w-full rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Gå med i {teamLabel}
        </button>
      </form>
      <Link
        href="/konto"
        className="text-center text-sm text-zinc-500 underline dark:text-zinc-400"
      >
        Avbryt
      </Link>
    </main>
  );
}
