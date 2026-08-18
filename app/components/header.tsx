import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>🎣</span>
          Fiskelogg
        </Link>

        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
              {user.name}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Logga ut
              </button>
            </form>
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login">Logga in</Link>
            <Link
              href="/signup"
              className="rounded-full bg-foreground px-3 py-1.5 text-background"
            >
              Skapa konto
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
