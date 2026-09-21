"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitFeedback } from "@/app/actions/feedback";

export default function FeedbackButton() {
  const [state, formAction, pending] = useActionState(submitFeedback, undefined);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (state && "success" in state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage("");
      const timer = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Feedback
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
        className="m-auto w-[min(90vw,28rem)] rounded-xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/15 dark:bg-zinc-900"
      >
        <form action={formAction} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Skicka feedback</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
            >
              Avbryt
            </button>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Fisklogg är i beta — hittat en bugg eller har en idé? Skriv den
            här, så går den direkt till mig.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="feedback-message" className="text-sm font-medium">
              Meddelande
            </label>
            <textarea
              id="feedback-message"
              name="message"
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Vad fungerade inte, eller vad vill du se?"
              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
            />
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}
          {state && "success" in state && (
            <p role="status" className="text-sm text-green-600 dark:text-green-400">
              Tack! Skickat.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !message.trim()}
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? "Skickar…" : "Skicka"}
          </button>
        </form>
      </dialog>
    </>
  );
}
