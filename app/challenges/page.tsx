import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getBingoCards, getBingoCatches } from "@/lib/bingo";
import { getSpeciesBreakdown } from "@/lib/stats";
import { getPersonalBests } from "@/lib/personal-bests";
import { getStorfiskPercent } from "@/lib/storfisk";
import { FISH_SPECIES } from "@/lib/species";
import BingoCardForm from "@/app/components/bingo-card-form";
import BingoCardGrid from "@/app/components/bingo-card-grid";
import SpeciesCollection from "@/app/components/species-collection";

export const metadata: Metadata = {
  title: "Challenges – Fisklogg",
};

export default async function ChallengesPage() {
  const user = await requireUser();
  const [cards, speciesBreakdown, personalBests] = await Promise.all([
    getBingoCards(user.id, user.team_id),
    user.show_species_collection ? getSpeciesBreakdown(user.id) : Promise.resolve([]),
    user.show_species_collection ? getPersonalBests(user.id) : Promise.resolve([]),
  ]);
  const caughtSpecies = new Set(speciesBreakdown.map((s) => s.species));
  const pbSpecies = new Set(personalBests.map((pb) => pb.species));
  const storfiskSpecies = new Set(
    personalBests
      .filter(
        (pb) =>
          pb.heaviest &&
          (getStorfiskPercent(pb.species, pb.heaviest.weight_kg) ?? 0) >= 100
      )
      .map((pb) => pb.species)
  );

  function speciesHref(species: string) {
    return `/statistik/${encodeURIComponent(species)}`;
  }

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

      {user.show_species_collection && (
        <details open className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <summary className="cursor-pointer text-lg font-semibold">
            Artjakten
          </summary>

          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {caughtSpecies.size} av {FISH_SPECIES.length} arter fångade.
            </p>
            <SpeciesCollection
              caught={caughtSpecies}
              storfisk={storfiskSpecies}
              hasPb={pbSpecies}
              getHref={speciesHref}
            />
          </div>
        </details>
      )}
    </main>
  );
}
