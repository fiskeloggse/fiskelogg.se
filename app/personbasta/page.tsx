import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getPersonalBests } from "@/lib/personal-bests";
import CatchTabs from "@/app/components/catch-tabs";
import PersonalBests from "@/app/components/personal-bests";

export const metadata: Metadata = {
  title: "Personbästa – Fisklogg",
};

export default async function PersonbastaPage() {
  const user = await requireUser();
  const bests = await getPersonalBests(user.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/personbasta" />

      <PersonalBests bests={bests} />
    </main>
  );
}
