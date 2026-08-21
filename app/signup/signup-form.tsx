"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined);
  const errorMessage = state && "error" in state ? state.error : undefined;
  // Controlled — Next.js's sequential Server Action dispatch (one action
  // per client at a time) doesn't reliably pick up a retried submission
  // when these are left uncontrolled: after an error, a second click on
  // "Skapa konto" silently does nothing until the page is reloaded.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (state && "success" in state) window.location.href = "/";
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Namn
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-post
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Lösenord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Minst 8 tecken.
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Skapar konto…" : "Skapa konto"}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Har du redan ett konto?{" "}
        <Link href="/login" className="font-medium text-foreground">
          Logga in
        </Link>
      </p>
    </form>
  );
}
