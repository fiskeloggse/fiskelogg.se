import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getPersonalBests } from "@/lib/personal-bests";
import PersonalBests from "@/app/components/personal-bests";

export const metadata: Metadata = {
  title: "Personbästa – Fisklogg",
};

export default async function PersonbastaPage() {
  const user = await requireUser();
  const bests = await getPersonalBests(user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <PersonalBests bests={bests} />
    </main>
  );
}
