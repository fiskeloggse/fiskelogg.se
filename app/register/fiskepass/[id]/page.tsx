import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getFiskepassById, getFiskepassCatches } from "@/lib/fiskepass";
import type { Catch } from "@/app/components/catch-list";
import { PassCatchList } from "@/app/components/fiskepass-history";

export const metadata: Metadata = {
  title: "Fiskepass – Fisklogg",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" });
}

function formatSv(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

type SpeciesSummary = {
  species: string;
  totalCount: number;
  topCount: number;
  topSumCm: number;
  avgCm: number;
};

// Sum of the (up to) 5 longest catches per species -- a classic storfiske-
// tävling scoring format -- plus the average length across every catch of
// that species in the pass (not just the top 5, which would just restate
// the sum in a different shape).
function computeSpeciesSummaries(catches: Catch[]): SpeciesSummary[] {
  const bySpecies = new Map<string, (Catch & { length_cm: number })[]>();
  for (const c of catches) {
    if (!c.species || c.length_cm == null) continue;
    const list = bySpecies.get(c.species);
    if (list) {
      list.push(c as Catch & { length_cm: number });
    } else {
      bySpecies.set(c.species, [c as Catch & { length_cm: number }]);
    }
  }

  const summaries: SpeciesSummary[] = [];
  for (const [species, list] of bySpecies) {
    const sorted = [...list].sort((a, b) => b.length_cm - a.length_cm);
    const top = sorted.slice(0, 5);
    const topSumCm = top.reduce((sum, c) => sum + c.length_cm, 0);
    const avgCm = list.reduce((sum, c) => sum + c.length_cm, 0) / list.length;
    summaries.push({
      species,
      totalCount: list.length,
      topCount: top.length,
      topSumCm,
      avgCm,
    });
  }

  return summaries.sort(
    (a, b) => b.totalCount - a.totalCount || a.species.localeCompare(b.species, "sv")
  );
}

export default async function FiskepassDetailPage(
  props: PageProps<"/register/fiskepass/[id]">
) {
  const user = await requireUser();
  const { id } = await props.params;
  const passId = Number(id);
  if (!Number.isInteger(passId)) notFound();

  const pass = await getFiskepassById(user.id, passId);
  if (!pass) notFound();

  const catches = await getFiskepassCatches(user.id, passId);
  const speciesSummaries = computeSpeciesSummaries(catches);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/register/fiskepass"
        className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
      >
        ← Tillbaka till Fiskepass
      </Link>

      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <h1 className="text-lg font-semibold">
          Fiskepass
          <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
            {pass.team_id ? "Team" : "Ensam"}
          </span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDateTime(pass.start_time)}
          {pass.stop_time ? ` – ${formatDateTime(pass.stop_time)}` : " – pågår"}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
          {pass.target_species && pass.target_species.length > 0 && (
            <p>Målart: {pass.target_species.join(", ")}</p>
          )}
          {pass.water_temp_c != null && <p>Vattentemperatur: {pass.water_temp_c}°C</p>}
          <p>
            {catches.length} {catches.length === 1 ? "fångst" : "fångster"}
          </p>
        </div>
      </div>

      {speciesSummaries.length > 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Sammanfattning per art</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {speciesSummaries.map((s) => (
              <li key={s.species} className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{s.species}</span>
                <span className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                  {s.topCount} st · {formatSv(s.topSumCm)} cm totalt
                  {s.topCount < s.totalCount && ` (topp ${s.topCount})`}
                  <br />
                  Snitt {formatSv(s.avgCm)} cm över {s.totalCount}{" "}
                  {s.totalCount === 1 ? "fångst" : "fångster"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white dark:border-white/15 dark:bg-white/5">
        <PassCatchList catches={catches} isTeam={pass.team_id != null} />
      </div>
    </main>
  );
}
