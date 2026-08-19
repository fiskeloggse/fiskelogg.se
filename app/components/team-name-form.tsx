"use client";

import { useActionState } from "react";
import { updateTeamName } from "@/app/actions/team";

export default function TeamNameForm({
  currentName,
}: {
  currentName: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateTeamName, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="team-name" className="text-sm font-medium">
        Teamnamn
      </label>
      <div className="flex gap-2">
        <input
          id="team-name"
          name="name"
          type="text"
          maxLength={60}
          defaultValue={currentName ?? ""}
          placeholder="Ge ert team ett namn"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? "Sparar…" : "Spara"}
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
