import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import {
  getLakeVisitStats,
  getTopCatchesByLake,
  type TopCatchBySpeciesRow,
} from "@/app/actions/stats";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

function groupBySpecies(
  rows: TopCatchBySpeciesRow[]
): { species: string; catches: TopCatchBySpeciesRow[] }[] {
  const groups: { species: string; catches: TopCatchBySpeciesRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.species === row.species) {
      last.catches.push(row);
    } else {
      groups.push({ species: row.species, catches: [row] });
    }
  }
  return groups;
}

export async function generateMetadata(
  props: PageProps<"/statistik/vatten/[lake]">
): Promise<Metadata> {
  const { lake } = await props.params;
  return { title: `${decodeURIComponent(lake)} – Statistik – Fisklogg` };
}

export default async function LakeStatsPage(
  props: PageProps<"/statistik/vatten/[lake]">
) {
  const user = await requireUser();
  const { lake: rawLake } = await props.params;
  const lake = decodeURIComponent(rawLake);
  const [visitStats, catches] = await Promise.all([
    getLakeVisitStats(lake),
    getTopCatchesByLake(lake),
  ]);
  const groups = groupBySpecies(catches);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/statistik"
        className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
      >
        ← Tillbaka till Statistik
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{lake}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {visitStats.days} {visitStats.days === 1 ? "fiskedag" : "fiskedagar"} ·{" "}
          {visitStats.fishCount} {visitStats.fishCount === 1 ? "fisk" : "fiskar"}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Inga uppmätta fångster i det här vattnet än.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.species}>
              <h2 className="text-lg font-semibold">{group.species}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {group.catches.map((c) => {
                  const rowClassName =
                    "flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-white/5";
                  const content = (
                    <>
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
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
