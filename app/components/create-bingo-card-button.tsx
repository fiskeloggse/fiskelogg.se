"use client";

import { useEffect, useRef, useState } from "react";
import BingoCardForm from "./bingo-card-form";

// Lives top-right next to the "Bingo" heading, same slot pattern as
// "Starta fiskepass" on the home page -- a button that opens a dialog
// instead of an inline collapsible form buried below the card list.
export default function CreateBingoCardButton({ hasTeam }: { hasTeam: boolean }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        + Skapa bingobricka
      </button>

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto max-h-[90vh] w-[min(90vw,32rem)] overflow-y-auto bg-transparent p-0 backdrop:bg-black/40"
      >
        <BingoCardForm hasTeam={hasTeam} onClose={() => setOpen(false)} />
      </dialog>
    </>
  );
}
