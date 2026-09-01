import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getTrashedCatches } from "@/lib/trash";
import TrashList from "@/app/components/trash-list";

export const metadata: Metadata = {
  title: "Papperskorg – Fisklogg",
};

export default async function TrashPage(
  props: PageProps<"/register/papperskorg">
) {
  const user = await requireUser();
  const trashed = await getTrashedCatches(user.id);
  const searchParams = await props.searchParams;
  const query = new URLSearchParams(
    searchParams as Record<string, string>
  ).toString();
  const backHref = `/register${query ? `?${query}` : ""}`;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Papperskorg</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Raderade fångster. Återställ dem eller radera permanent.
          </p>
        </div>
        <Link href={backHref} className="text-sm text-zinc-500 underline dark:text-zinc-400">
          ← Tillbaka till Register
        </Link>
      </div>

      <TrashList catches={trashed} />
    </main>
  );
}
