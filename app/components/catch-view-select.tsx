"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "recent", label: "5 senaste fångsterna" },
  { value: "today-longest", label: "Dagens 5 längsta" },
] as const;

export default function CatchViewSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("view") ?? "recent";

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        params.set("view", e.target.value);
        router.replace(`/?${params.toString()}`);
      }}
      aria-label="Välj vy"
      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
