"use client";

import { useState } from "react";
import ChangePasswordForm from "./change-password-form";

// Starts as just a button instead of showing the password fields
// immediately -- most visits to Konto never touch this.
export default function ChangePasswordButton() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Byt lösenord
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/15">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Byt lösenord</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
