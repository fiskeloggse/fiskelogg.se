import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getTopCatchesForSpecies } from "@/app/actions/stats";

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
  await requireUser();
  const { species: rawSpecies } = await props.params;
  const species = decodeURIComponent(rawSpecies);
  const catches = await getTopCatchesForSpecies(species);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/statistik"
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
          {catches.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-white/5"
            >
              <span className="text-lg font-medium">
                {[
                  c.length_cm != null ? `${c.length_cm} cm` : null,
                  c.weight_kg != null ? `${formatSv(c.weight_kg)} kg` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                {c.angler_name}
                <br />
                <span className="text-xs">{formatDate(c.caught_at)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
