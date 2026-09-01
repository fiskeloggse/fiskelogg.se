import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Återställ lösenord – Fisklogg",
};

export default async function ResetPasswordPage(
  props: PageProps<"/aterstall-losenord">
) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Återställ lösenord</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Länken saknar en giltig kod.{" "}
          <Link href="/glomt-losenord" className="font-medium text-foreground">
            Begär en ny länk
          </Link>
          .
        </p>
      )}
    </main>
  );
}
