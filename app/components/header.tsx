import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import CatchTabs from "@/app/components/catch-tabs";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>🎣</span>
          Fisklogg
        </Link>

        {user ? (
          <Link
            href="/konto"
            className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
          >
            Konto
          </Link>
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

      {user && (
        <div className="mx-auto max-w-4xl border-t border-black/10 px-4 sm:px-6 dark:border-white/10">
          <CatchTabs showBingo={user.show_bingo} />
        </div>
      )}
    </header>
  );
}
