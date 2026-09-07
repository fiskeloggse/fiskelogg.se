import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import {
  getDistinctFiskepassYears,
  getDistinctTargetSpecies,
  getFiskepassHistory,
  getFiskepassMapCatches,
  hasActiveFiskepassFilters,
  parseFiskepassFilters,
} from "@/lib/fiskepass";
import { parsePagination, toURLSearchParams } from "@/lib/register-catches";
import FiskepassFilterBar from "@/app/components/fiskepass-filter-bar";
import FiskepassHistory from "@/app/components/fiskepass-history";
import RegisterMapToggle from "@/app/components/register-map-toggle";
import RegisterPagination from "@/app/components/register-pagination";
import RegisterSearch from "@/app/components/register-search";
import RegisterTabs from "@/app/components/register-tabs";

export const metadata: Metadata = {
  title: "Fiskepass – Fisklogg",
};

export default async function RegisterFiskepassPage(
  props: PageProps<"/register/fiskepass">
) {
  const user = await requireUser();
  if (!user.show_fiskepass) redirect("/register");

  const rawSearchParams = await props.searchParams;
  const params = toURLSearchParams(rawSearchParams);
  const filters = parseFiskepassFilters(params);
  const hasFilters = hasActiveFiskepassFilters(filters);
  const { page: requestedPage, pageSize } = parsePagination(params);

  const [history, targetSpeciesOptions, yearOptions, mapCatches] = await Promise.all([
    getFiskepassHistory(user.id, filters),
    getDistinctTargetSpecies(user.id),
    getDistinctFiskepassYears(user.id),
    getFiskepassMapCatches(user.id, filters),
  ]);

  const exportHref = `/register/fiskepass/export?${params.toString()}`;

  const totalPages = pageSize ? Math.max(1, Math.ceil(history.length / pageSize)) : 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const pageHistory = pageSize
    ? history.slice((page - 1) * pageSize, page * pageSize)
    : history;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <RegisterTabs showFiskepass={user.show_fiskepass} />
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{history.length} pass</h2>
          <div className="flex items-center gap-4 text-sm">
            {hasFilters && (
              <Link
                href="/register/fiskepass"
                className="text-zinc-500 underline dark:text-zinc-400"
              >
                Rensa filter
              </Link>
            )}
            <a
              href={exportHref}
              download="fiskepass.xlsx"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Exportera
            </a>
            <Link
              href={`/register/fiskepass/papperskorg${params.toString() ? `?${params.toString()}` : ""}`}
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Papperskorg
            </Link>
          </div>
        </div>
        <RegisterSearch placeholder="Sök målart, vatten eller fångad art…" />
        <FiskepassFilterBar targetSpeciesOptions={targetSpeciesOptions} years={yearOptions} />
        <RegisterMapToggle catches={mapCatches} />
      </div>

      <FiskepassHistory history={pageHistory} hasSearch={hasFilters} />

      <RegisterPagination
        basePath="/register/fiskepass"
        params={params}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        itemCount={history.length}
      />
    </main>
  );
}
