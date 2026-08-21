"use client";

import { useRouter } from "next/navigation";
import type { Catch } from "./catch-list";

export default function CompactLengthList({
  catches,
  currentUserId,
  emptyMessage = "Inga fångster loggade idag än.",
}: {
  catches: Catch[];
  currentUserId: number;
  emptyMessage?: string;
}) {
  const router = useRouter();

  if (catches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        {emptyMessage}
      </p>
    );
  }

  const total = catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
      <ul className="flex flex-col gap-1 text-sm">
        {catches.map((c) => {
          const isOwn = c.user_id === currentUserId;
          return (
            <li
              key={c.id}
              onClick={isOwn ? () => router.push(`/register/${c.id}`) : undefined}
              className={
                isOwn
                  ? "cursor-pointer rounded hover:bg-black/5 dark:hover:bg-white/5"
                  : undefined
              }
            >
              {c.length_cm} cm
            </li>
          );
        })}
      </ul>
      <div className="mt-2 border-t border-black/10 pt-2 text-sm font-semibold dark:border-white/15">
        {total} cm
      </div>
    </div>
  );
}
