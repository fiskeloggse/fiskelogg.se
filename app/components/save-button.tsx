"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Works with any <form action={...}> regardless of what that action
// returns -- useFormStatus reports the form's own submit lifecycle, so a
// plain fire-and-forget server action (no useActionState/success state)
// still gets a "saved" flash the moment its pending edge falls.
export default function SaveButton({ label = "Spara" }: { label?: string }) {
  // Normalized to a real boolean: after the revalidation a save triggers
  // settles, useFormStatus() has been observed to report `pending` as
  // `undefined` for one extra render rather than settling on `false`. Left
  // as-is, that reads as a second "pending changed" edge, whose effect
  // cleanup cancels the hide timer the true→false edge just armed --
  // "Sparat" would then never disappear. Coercing collapses both falsy
  // values into one, so the dependency array only sees one real edge.
  const { pending: rawPending } = useFormStatus();
  const pending = Boolean(rawPending);
  const [showSaved, setShowSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Sparar…" : label}
      </button>
      {showSaved && (
        <span className="text-sm text-green-600 dark:text-green-400">✓ Sparat</span>
      )}
    </div>
  );
}
