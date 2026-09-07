import Link from "next/link";
import { PAGE_SIZE_OPTIONS } from "@/lib/register-catches";

function hrefWithParams(
  basePath: string,
  params: URLSearchParams,
  overrides: Record<string, string | null>
): string {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

// Shared between Fångster and Fiskepass so both registers page the same
// way -- same per-sida choices, same "Sida X av Y" control.
export default function RegisterPagination({
  basePath,
  params,
  page,
  pageSize,
  totalPages,
  itemCount,
}: {
  basePath: string;
  params: URLSearchParams;
  page: number;
  pageSize: number | null;
  totalPages: number;
  itemCount: number;
}) {
  if (itemCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500 dark:text-zinc-400">Per sida:</span>
        {[...PAGE_SIZE_OPTIONS.map(String), "all"].map((size) => {
          const isActive = size === "all" ? pageSize === null : pageSize === Number(size);
          return (
            <Link
              key={size}
              href={hrefWithParams(basePath, params, { pageSize: size, page: null })}
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
            href={hrefWithParams(basePath, params, { page: String(page - 1) })}
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
            href={hrefWithParams(basePath, params, { page: String(page + 1) })}
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
  );
}
