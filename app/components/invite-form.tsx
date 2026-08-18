"use client";

import { useActionState } from "react";
import { inviteToTeam } from "@/app/actions/team";

export default function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteToTeam, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          placeholder="E-postadress"
          required
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Bjuder in…" : "Bjud in"}
        </button>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
