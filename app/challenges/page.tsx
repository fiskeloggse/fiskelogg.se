import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getBingoCards, getBingoCatches } from "@/lib/bingo";
import { getSpeciesBreakdown, getWeighedCatches } from "@/lib/stats";
import { getPersonalBests } from "@/lib/personal-bests";
import { getStorfiskPercent, STORFISKREGISTRET_SPECIES } from "@/lib/storfisk";
import BingoCardForm from "@/app/components/bingo-card-form";
import BingoCardGrid from "@/app/components/bingo-card-grid";
import SpeciesCollection from "@/app/components/species-collection";

export const metadata: Metadata = {
  title: "Utmaningar – Fisklogg",
};

export default async function ChallengesPage() {
  const user = await requireUser();
  const [cards, speciesBreakdown, personalBests, weighedCatches] = await Promise.all([
    getBingoCards(user.id, user.team_id),
    user.show_species_collection ? getSpeciesBreakdown(user.id) : Promise.resolve([]),
    user.show_species_collection ? getPersonalBests(user.id) : Promise.resolve([]),
    user.show_species_collection ? getWeighedCatches(user.id) : Promise.resolve([]),
  ]);
  const hiddenSpeciesSet = new Set(user.hidden_species ?? []);
  const trackedSpecies = STORFISKREGISTRET_SPECIES.filter(
    (species) => !hiddenSpeciesSet.has(species)
  );
  const registerSpeciesSet = new Set<string>(trackedSpecies);
  const caughtSpecies = new Set(
    speciesBreakdown
      .map((s) => s.species)
      .filter((species) => registerSpeciesSet.has(species))
  );
  // Counts every individual catch that clears the species' minimum weight,
  // not just the personal best -- 2 storfisk-Abborre + 2 storfisk-Gädda
  // should read as 4 storfiskar across 2 arter, not just "2 storfiskar".
  const storfiskSpecies = new Set<string>();
  let storfiskCount = 0;
  for (const c of weighedCatches) {
    if ((getStorfiskPercent(c.species, c.weight_kg) ?? 0) >= 100) {
      storfiskSpecies.add(c.species);
      storfiskCount++;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Bingo</h2>

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
      </div>

      {user.show_species_collection && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Artjakten</h2>

          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {caughtSpecies.size}/{trackedSpecies.length} fångade
              {storfiskCount > 0 &&
                ` · ${storfiskCount} 🏅 storfisk${storfiskCount === 1 ? "" : "ar"} (${storfiskSpecies.size} art${storfiskSpecies.size === 1 ? "" : "er"})`}
            </p>
            <SpeciesCollection
              speciesBreakdown={speciesBreakdown}
              personalBests={personalBests}
              hiddenSpecies={user.hidden_species ?? []}
            />
          </div>
        </div>
      )}
    </main>
  );
}
