import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getSpeciesSuggestions } from "@/lib/species-suggestions";
import {
  getDistinctBaits,
  getDistinctLakes,
  getFilteredCatches,
  hasActiveFilters,
  parseRegisterFilters,
  toURLSearchParams,
} from "@/lib/register-catches";
import CatchTable from "@/app/components/catch-table";
import ColumnVisibilityToggle from "@/app/components/column-visibility-toggle";
import RegisterMapToggle from "@/app/components/register-map-toggle";
import { REGISTER_COLUMN_KEYS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Register – Fisklogg",
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const user = await requireUser();
  const rawSearchParams = await props.searchParams;
  const params = toURLSearchParams(rawSearchParams);
  const filters = parseRegisterFilters(params);
  const hasFilters = hasActiveFilters(filters);

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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3">
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
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Exportera
            </a>
            <Link
              href="/register/papperskorg"
              className="text-zinc-500 underline dark:text-zinc-400"
            >
              Papperskorg
            </Link>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Klicka på en kolumnrubrik i tabellen för att filtrera eller sortera
          på den kolumnen.
        </p>
        <RegisterMapToggle catches={mapCatches} />
        <CatchTable
          catches={catches}
          currentUserId={user.id}
          speciesOptions={speciesSuggestions.all}
          lakeOptions={lakeOptions}
          baitOptions={baitOptions}
          visibleColumns={user.visible_register_columns}
        />
      </div>
    </main>
  );
}
