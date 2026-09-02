import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import {
  PAGE_SIZE_OPTIONS,
  getDistinctBaits,
  getDistinctLakes,
  getFilteredCatches,
  hasActiveFilters,
  parsePagination,
  parseRegisterFilters,
  toURLSearchParams,
} from "@/lib/register-catches";
import CatchTable from "@/app/components/catch-table";
import ColumnVisibilityToggle from "@/app/components/column-visibility-toggle";
import RegisterMapToggle from "@/app/components/register-map-toggle";
import RegisterSearch from "@/app/components/register-search";
import RegisterTabs from "@/app/components/register-tabs";
import { REGISTER_COLUMN_KEYS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Register – Fisklogg",
};

function hrefWithParams(
  params: URLSearchParams,
  overrides: Record<string, string | null>
): string {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return `/register${query ? `?${query}` : ""}`;
}

export default async function RegisterPage(props: PageProps<"/register">) {
  const user = await requireUser();
  const rawSearchParams = await props.searchParams;
  const params = toURLSearchParams(rawSearchParams);
  const filters = parseRegisterFilters(params);
  const hasFilters = hasActiveFilters(filters);
  const { page: requestedPage, pageSize } = parsePagination(params);

  const [speciesSuggestions, lakeOptions, baitOptions, catches] = await Promise.all([
    getSpeciesSuggestions(user.id),
    getDistinctLakes(user.id),
    getDistinctBaits(user.id),
    getFilteredCatches(user.id, filters),
  ]);

  const exportHref = `/register/export?${params.toString()}`;
  const mapCatches = catches.filter(
    (c): c is typeof c & { latitude: number; longitude: number } =>
      c.latitude != null && c.longitude != null
  );

  // The map and the "N fångster" count always reflect every filtered
  // catch -- only the table itself is paginated (sliced client-side, no
  // extra query, since we already fetched the full filtered set above).
  const totalPages = pageSize ? Math.max(1, Math.ceil(catches.length / pageSize)) : 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const pageCatches = pageSize ? catches.slice((page - 1) * pageSize, page * pageSize) : catches;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <RegisterTabs showFiskepass={user.show_fiskepass} />
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {catches.length} {catches.length === 1 ? "fångst" : "fångster"}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            {hasFilters && (
              <Link
                href="/register"
                className="text-zinc-500 underline dark:text-zinc-400"
              >
                Rensa filter
              </Link>
            )}
            <ColumnVisibilityToggle
              visible={user.visible_register_columns ?? REGISTER_COLUMN_KEYS}
            />
            <a
              href={exportHref}
              download="fangster.xlsx"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Exportera
            </a>
            <Link
              href={`/register/papperskorg${params.toString() ? `?${params.toString()}` : ""}`}
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Papperskorg
            </Link>
          </div>
        </div>
        <RegisterSearch />
        <RegisterMapToggle catches={mapCatches} />
      </div>
      <CatchTable
        catches={pageCatches}
        currentUserId={user.id}
        speciesOptions={speciesSuggestions.all}
        lakeOptions={lakeOptions}
        baitOptions={baitOptions}
        visibleColumns={user.visible_register_columns}
        totals={{
          count: catches.length,
          totalLength: catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0),
          totalWeight: catches.reduce((sum, c) => sum + (c.weight_kg ?? 0), 0),
        }}
      />

      {catches.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 dark:text-zinc-400">Per sida:</span>
            {[...PAGE_SIZE_OPTIONS.map(String), "all"].map((size) => {
              const isActive = size === "all" ? pageSize === null : pageSize === Number(size);
              return (
                <Link
                  key={size}
                  href={hrefWithParams(params, { pageSize: size, page: null })}
                  className={
                    "rounded-full px-3 py-1 " +
                    (isActive
                      ? "bg-foreground text-background"
                      : "text-zinc-500 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10")
                  }
                >
                  {size === "all" ? "Alla" : size}
                </Link>
              );
            })}
          </div>

          {pageSize && totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Link
                href={hrefWithParams(params, { page: String(page - 1) })}
                aria-disabled={page <= 1}
                className={
                  "underline " +
                  (page <= 1
                    ? "pointer-events-none text-zinc-300 dark:text-zinc-700"
                    : "text-zinc-500 hover:text-foreground dark:text-zinc-400")
                }
              >
                Föregående
              </Link>
              <span className="text-zinc-500 dark:text-zinc-400">
                Sida {page} av {totalPages}
              </span>
              <Link
                href={hrefWithParams(params, { page: String(page + 1) })}
                aria-disabled={page >= totalPages}
                className={
                  "underline " +
                  (page >= totalPages
                    ? "pointer-events-none text-zinc-300 dark:text-zinc-700"
                    : "text-zinc-500 hover:text-foreground dark:text-zinc-400")
                }
              >
                Nästa
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
