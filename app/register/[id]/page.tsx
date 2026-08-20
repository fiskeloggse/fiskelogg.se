import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getCatchById } from "@/lib/register-catches";
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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <CatchDetail item={item} />
    </main>
  );
}
