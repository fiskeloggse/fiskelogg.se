"use client";

import { useRef, useState } from "react";
import { deleteAllCatches } from "@/app/actions/catches";
import ConfirmDialog from "./confirm-dialog";

export default function DeleteAllCatchesForm({
  catchCount,
}: {
  catchCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function closeAndReset() {
    setOpen(false);
    setConfirm1(false);
    setConfirm2(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Flyttar alla dina {catchCount}{" "}
        {catchCount === 1 ? "loggade fångst" : "loggade fångster"} till
        papperskorgen.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={catchCount === 0}
        className="self-start rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-40 dark:bg-red-700 dark:hover:bg-red-600"
      >
        Radera alla fångster
      </button>

      <form ref={formRef} action={deleteAllCatches} className="hidden" />

      <ConfirmDialog
        open={open}
        title="Radera alla fångster?"
        description={`Flyttar alla ${catchCount} fångster till papperskorgen — du kan återställa dem därifrån.`}
        confirmLabel="Radera alla fångster"
        confirmDisabled={!confirm1 || !confirm2}
        onCancel={closeAndReset}
        onConfirm={() => {
          closeAndReset();
          formRef.current?.requestSubmit();
        }}
      >
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirm1}
              onChange={(e) => setConfirm1(e.target.checked)}
            />
            Jag förstår att detta raderar alla mina fångster.
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirm2}
              onChange={(e) => setConfirm2(e.target.checked)}
            />
            Jag är säker på att jag vill göra detta.
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}
