"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { completeOnboarding, skipOnboarding } from "@/app/actions/preferences";

type Step = "welcome" | "features";

// Shown automatically on first login (autoOpen, from the home page) and
// reachable again any time from Konto (withTrigger, autoOpen left false) --
// both cases share this one dialog so the feature picker behaves
// identically whichever way it was opened.
export default function OnboardingGuide({
  showBingo,
  showSpeciesCollection,
  showFiskepass,
  autoOpen = false,
  withTrigger = false,
}: {
  showBingo: boolean;
  showSpeciesCollection: boolean;
  showFiskepass: boolean;
  autoOpen?: boolean;
  withTrigger?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState<Step>("welcome");
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    // Reset for next time the dialog opens (either a later Konto visit, or
    // this same mount if autoOpen re-triggers) so it never resumes on the
    // features step.
    setStep("welcome");
  }

  function handleSkip() {
    startTransition(async () => {
      await skipOnboarding();
      close();
    });
  }

  function handleComplete(formData: FormData) {
    startTransition(async () => {
      await completeOnboarding(formData);
      close();
    });
  }

  return (
    <>
      {withTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Visa guiden
        </button>
      )}

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          handleSkip();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) handleSkip();
        }}
        className="m-auto w-[min(90vw,28rem)] rounded-xl border border-black/10 bg-white p-0 backdrop:bg-black/40 dark:border-white/15 dark:bg-zinc-900"
      >
        {step === "welcome" ? (
          <div className="flex flex-col gap-4 p-5">
            <h2 className="text-lg font-semibold">Välkommen till Fisklogg!</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Logga fångster på sekunder, håll koll på statistik över tid och
              tävla i egna utmaningar — solo eller med ditt fiskelag. Låt oss
              snabbt välja vilka delar av appen du vill ha framme.
            </p>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkip}
                disabled={pending}
                className="text-sm text-zinc-500 hover:text-foreground disabled:opacity-60 dark:text-zinc-400"
              >
                Hoppa över
              </button>
              <button
                type="button"
                onClick={() => setStep("features")}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Nästa
              </button>
            </div>
          </div>
        ) : (
          <form action={handleComplete} className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-lg font-semibold">Vilka funktioner vill du använda?</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Du kan alltid ändra detta senare under Konto → Funktioner.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="show_bingo"
                  defaultChecked={showBingo}
                />
                Visa Utmaningar-fliken
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="show_species_collection"
                  defaultChecked={showSpeciesCollection}
                />
                Visa Artjakten (under Utmaningar)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="show_fiskepass"
                  defaultChecked={showFiskepass}
                />
                Visa Fiskepass
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep("welcome")}
                disabled={pending}
                className="text-sm text-zinc-500 hover:text-foreground disabled:opacity-60 dark:text-zinc-400"
              >
                Tillbaka
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {pending ? "Sparar…" : "Klar"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
