import type { Metadata } from "next";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Glömt lösenord – Fisklogg",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Glömt lösenord</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Ange din e-postadress så skickar vi en länk för att välja ett nytt
        lösenord.
      </p>
      <ForgotPasswordForm />
    </main>
  );
}
