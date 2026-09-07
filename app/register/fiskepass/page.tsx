import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getFiskepassHistory } from "@/lib/fiskepass";
import FiskepassHistory from "@/app/components/fiskepass-history";
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

  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const history = await getFiskepassHistory(user.id, q);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <RegisterTabs showFiskepass={user.show_fiskepass} />
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{history.length} pass</h2>
          {q && (
            <Link
              href="/register/fiskepass"
              className="text-sm text-zinc-500 underline dark:text-zinc-400"
            >
              Rensa filter
            </Link>
          )}
        </div>
        <RegisterSearch placeholder="Sök målart, vatten eller fångad art…" />
      </div>
      <FiskepassHistory history={history} hasSearch={Boolean(q)} />
    </main>
  );
}
