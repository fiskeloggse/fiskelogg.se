import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getCatchById } from "@/lib/register-catches";
import CatchTabs from "@/app/components/catch-tabs";
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
      <div>
        <h1 className="text-2xl font-semibold">Mina fångster</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Välkommen, {user.name}.
        </p>
      </div>

      <CatchTabs active="/register" showBingo={user.show_bingo} />

      <CatchDetail item={item} />
    </main>
  );
}
