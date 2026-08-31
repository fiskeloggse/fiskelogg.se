import Link from "next/link";
import { FISH_SPECIES } from "@/lib/species";

export default function SpeciesCollection({
  caught,
  storfisk,
  hasPb,
  getHref,
}: {
  caught: Set<string>;
  storfisk: Set<string>;
  hasPb: Set<string>;
  getHref: (species: string) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {FISH_SPECIES.map((species) => {
        const isCaught = caught.has(species);
        if (!isCaught) {
          return (
            <div
              key={species}
              className="rounded-lg border border-dashed border-black/10 px-2.5 py-1.5 text-sm text-zinc-400 dark:border-white/10 dark:text-zinc-600"
            >
              {species}
            </div>
          );
        }
        return (
          <Link
            key={species}
            href={getHref(species)}
            className="rounded-lg border border-foreground/30 bg-foreground/5 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/10"
          >
            {species}
            {hasPb.has(species) && (
              <span className="ml-1" title="Personbästa">
                🏆
              </span>
            )}
            {storfisk.has(species) && (
              <span className="ml-1" title="Storfisk">
                🎣
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
