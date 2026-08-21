"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "./confirm-dialog";

export default function ConfirmDeleteButton({
  action,
  id,
  compact = false,
  label = "Ta bort",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  compact?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={
          compact
            ? "shrink-0 px-1 text-lg leading-none text-zinc-400 transition-colors hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
            : "shrink-0 rounded-full px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        }
      >
        {compact ? "×" : label}
      </button>

      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="id" value={id} />
      </form>

      <ConfirmDialog
        open={open}
        title={`${label}?`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
