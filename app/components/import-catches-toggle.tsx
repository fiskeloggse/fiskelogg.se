"use client";

import { useState } from "react";
import ImportCatchesForm from "./import-catches-form";

export default function ImportCatchesToggle() {
  const [open, setOpen] = useState(false);

  if (open) {
    return <ImportCatchesForm onClose={() => setOpen(false)} />;
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
    >
      + Importera från Excel
    </button>
  );
}
