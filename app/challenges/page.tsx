import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getBingoCards, getBingoCatches } from "@/lib/bingo";
import BingoCardForm from "@/app/components/bingo-card-form";
import BingoCardGrid from "@/app/components/bingo-card-grid";

export const metadata: Metadata = {
  title: "Challenges – Fisklogg",
};

export default async function ChallengesPage() {
  const user = await requireUser();
  const cards = await getBingoCards(user.id, user.team_id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <details open className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <summary className="cursor-pointer text-lg font-semibold">
          Bingo
        </summary>

        <div className="mt-4 flex flex-col gap-6">
          {cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              Inga bingobrickor än. Skapa den första nedan!
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {await Promise.all(
                cards.map(async (card) => {
                  const catchesByCm = await getBingoCatches(card);
                  return (
                    <BingoCardGrid key={card.id} card={card} catchesByCm={catchesByCm} />
                  );
                })
              )}
            </div>
          )}

          <details>
            <summary className="cursor-pointer text-base font-semibold">
              Skapa bingobricka
            </summary>
            <div className="mt-3">
              <BingoCardForm hasTeam={user.team_id !== null} />
            </div>
          </details>
        </div>
      </details>
    </main>
  );
}
