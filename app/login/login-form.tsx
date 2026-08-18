"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Loggar in…" : "Logga in"}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Inget konto?{" "}
        <Link href="/signup" className="font-medium text-foreground">
          Skapa ett här
        </Link>
      </p>
    </form>
  );
}
