"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CatchSpeciesFilter({ species }: { species: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("species") ?? "";

  if (species.length === 0) return null;

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) {
          params.set("species", e.target.value);
        } else {
          params.delete("species");
        }
        router.replace(`/?${params.toString()}`);
      }}
      aria-label="Filtrera på art"
      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm dark:border-white/15 dark:bg-transparent"
    >
      <option value="">Alla arter</option>
      {species.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
