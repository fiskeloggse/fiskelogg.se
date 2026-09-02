import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getFiskepassHistory } from "@/lib/fiskepass";
import FiskepassHistory from "@/app/components/fiskepass-history";
import RegisterTabs from "@/app/components/register-tabs";

export const metadata: Metadata = {
  title: "Fiskepass – Fisklogg",
};

export default async function RegisterFiskepassPage() {
  const user = await requireUser();
  if (!user.show_fiskepass) redirect("/register");

  const history = await getFiskepassHistory(user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <RegisterTabs showFiskepass={user.show_fiskepass} />
      <FiskepassHistory history={history} />
    </main>
  );
}
