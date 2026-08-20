"use client";

import { useState } from "react";
import CatchesMap, { type MapCatch } from "./catches-map";

export default function RegisterMapToggle({
  catches,
}: {
  catches: MapCatch[];
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
      >
        {show ? "Dölj karta" : "Visa karta"}
      </button>
      {show &&
        (catches.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Inga fångster med sparad position i det filtrerade urvalet.
          </p>
        ) : (
          <CatchesMap catches={catches} />
        ))}
    </div>
  );
}
