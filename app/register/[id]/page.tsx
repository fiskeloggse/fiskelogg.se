import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getCatchById } from "@/lib/register-catches";
import { getPreviousBest } from "@/lib/personal-bests";
import CatchDetail from "@/app/components/catch-detail";

export const metadata: Metadata = {
  title: "Fångst – Fisklogg",
};

export default async function CatchDetailPage(props: PageProps<"/register/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const catchId = Number(id);
  if (!Number.isInteger(catchId)) notFound();

  const item = await getCatchById(user.id, catchId);
  if (!item) notFound();

  const previousBest = item.species
    ? await getPreviousBest(item.user_id, item.species, item.id)
    : { maxLength: null, maxWeight: null };
  const isPersonalBest =
    (item.length_cm != null &&
      (previousBest.maxLength === null || item.length_cm > previousBest.maxLength)) ||
    (item.weight_kg != null &&
      (previousBest.maxWeight === null || item.weight_kg > previousBest.maxWeight));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <CatchDetail item={item} isPersonalBest={isPersonalBest} />
    </main>
  );
}
