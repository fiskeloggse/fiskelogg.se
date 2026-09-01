import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getTopCatchesForSpecies } from "@/app/actions/stats";
import { getPersonalBests } from "@/lib/personal-bests";
import { getStorfiskPercent } from "@/lib/storfisk";
import StorfiskBadge from "@/app/components/storfisk-badge";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

export async function generateMetadata(
  props: PageProps<"/statistik/[species]">
): Promise<Metadata> {
  const { species } = await props.params;
  return { title: `${decodeURIComponent(species)} – Statistik – Fisklogg` };
}

export default async function SpeciesStatsPage(
  props: PageProps<"/statistik/[species]">
) {
  const user = await requireUser();
  const { species: rawSpecies } = await props.params;
  const species = decodeURIComponent(rawSpecies);
  const [catches, personalBests] = await Promise.all([
    getTopCatchesForSpecies(species),
    getPersonalBests(user.id),
  ]);
  const pb = personalBests.find((p) => p.species === species);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/statistik?expand=species"
        className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
      >
        ← Tillbaka till Statistik
      </Link>

      <h1 className="text-xl font-semibold">Största {species}</h1>

      {catches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Inga fångster av arten än.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {catches.map((c) => {
            const isLongestPb = pb?.longest?.id === c.id;
            const isHeaviestPb = pb?.heaviest?.id === c.id;
            const isStorfisk =
              c.weight_kg != null &&
              (getStorfiskPercent(species, c.weight_kg) ?? 0) >= 100;
            const rowClassName =
              "flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-white/5";
            const content = (
              <>
                <span className="flex items-center gap-2">
                  <span className="text-lg font-medium">
                    {[
                      c.length_cm != null ? `${c.length_cm} cm` : null,
                      c.weight_kg != null ? `${formatSv(c.weight_kg)} kg` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {(isLongestPb || isHeaviestPb) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-zinc-900">
                      🏆{" "}
                      {isLongestPb && isHeaviestPb
                        ? "Personbästa"
                        : isLongestPb
                          ? "Längst"
                          : "Tyngst"}
                    </span>
                  )}
                  {isStorfisk && <StorfiskBadge />}
                </span>
                <span className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                  {c.angler_name}
                  <br />
                  <span className="text-xs">{formatDate(c.caught_at)}</span>
                </span>
              </>
            );

            return (
              <li key={c.id}>
                {c.user_id === user.id ? (
                  <Link
                    href={`/register/${c.id}`}
                    className={rowClassName + " transition-colors hover:bg-black/5 dark:hover:bg-white/10"}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={rowClassName}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
