"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApply } from "./register-header-filters";

export default function RegisterSearch() {
  const searchParams = useSearchParams();
  const apply = useApply();
  const currentQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQ);
  const [prevQ, setPrevQ] = useState(currentQ);

  // Keep the field in sync when the query is cleared elsewhere (e.g.
  // "Rensa filter"), without fighting the user's own typing otherwise —
  // adjusting state during render (React's recommended pattern for this)
  // instead of in an effect avoids an extra render pass.
  if (currentQ !== prevQ) {
    setPrevQ(currentQ);
    setValue(currentQ);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === currentQ) return;
    const timer = setTimeout(() => {
      apply((params) => {
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Sök art eller vatten…"
      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
    />
  );
}
