import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import CatchTabs from "@/app/components/catch-tabs";
import FeedbackButton from "@/app/components/feedback-button";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-2.5 sm:py-4 sm:px-6">
        <Link
          href="/"
          aria-label="Fisklogg"
          className="flex shrink-0 items-center gap-2 text-base font-semibold sm:text-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo mark, not worth next/image's overhead */}
          <img
            src="/logo-mark-small.png"
            alt=""
            className="h-6 w-6 sm:h-7 sm:w-7"
          />
          <span className="hidden sm:inline">Fisklogg</span>
        </Link>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-950/40 dark:text-amber-400">
          Beta
        </span>

        {user ? (
          <>
            <CatchTabs
              showChallenges={user.show_bingo || user.show_species_collection}
            />
            <FeedbackButton />
          </>
        ) : (
          <nav className="ml-auto flex items-center gap-4 text-sm font-medium">
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
