import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getBingoCards, getBingoCatches } from "@/lib/bingo";
import CatchTabs from "@/app/components/catch-tabs";
import BingoCardForm from "@/app/components/bingo-card-form";
import BingoCardGrid from "@/app/components/bingo-card-grid";

export const metadata: Metadata = {
  title: "Bingo – Fisklogg",
};

export default async function BingoPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/bingo" />

      {!user.team_id ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Bingobrickor är en lagutmaning. Du måste vara med i ett team för att
          skapa eller se en.{" "}
          <Link href="/konto" className="underline">
            Bjud in någon
          </Link>{" "}
          under Konto.
        </p>
      ) : (
        <BingoContent teamId={user.team_id} />
      )}
    </main>
  );
}

async function BingoContent({ teamId }: { teamId: number }) {
  const cards = await getBingoCards(teamId);

  return (
    <>
      <BingoCardForm />

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Inga bingobrickor än. Skapa den första ovan!
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {await Promise.all(
            cards.map(async (card) => {
              const catchesByCm = await getBingoCatches(teamId, card);
              return (
                <BingoCardGrid key={card.id} card={card} catchesByCm={catchesByCm} />
              );
            })
          )}
        </div>
      )}
    </>
  );
}
