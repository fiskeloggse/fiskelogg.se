import Link from "next/link";
import type { PersonalBest } from "@/lib/personal-bests";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

export default function PersonalBests({
  bests,
  getHref,
}: {
  bests: PersonalBest[];
  getHref?: (species: string) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {bests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Inga personbästa än. Logga en fångst för att komma igång!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bests.map((pb) => {
            const content = (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <p className="font-semibold">{pb.species}</p>
                </div>
                <div className="mt-3 flex gap-8">
                  {pb.longest && (
                    <div>
                      <p className="text-2xl font-semibold tabular-nums">
                        {pb.longest.length_cm} cm
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Längst · {formatDate(pb.longest.caught_at)}
                      </p>
                    </div>
                  )}
                  {pb.heaviest && (
                    <div>
                      <p className="text-2xl font-semibold tabular-nums">
                        {formatSv(pb.heaviest.weight_kg)} kg
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tyngst · {formatDate(pb.heaviest.caught_at)}
                      </p>
                    </div>
                  )}
                </div>
              </>
            );

            return (
              <li key={pb.species}>
                {getHref ? (
                  <Link
                    href={getHref(pb.species)}
                    className="block rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-foreground/30 hover:bg-black/5 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-white/5">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
