"use client";

import { useRouter } from "next/navigation";
import { deleteCatch } from "@/app/actions/catches";
import ConfirmDeleteButton from "./confirm-delete-button";
import type { Catch } from "./catch-list";

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatSv(n: number): string {
  return roundTo2(n).toString().replace(".", ",");
}

export default function TodayTopList({
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

  const totalLength = catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg ?? 0), 0);

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/15">
        {catches.map((item) => {
          const isOwn = item.user_id === currentUserId;
          return (
            <li
              key={item.id}
              onClick={isOwn ? () => router.push(`/register/${item.id}`) : undefined}
              className={
                "flex items-center justify-between gap-2 px-3 py-2 " +
                (isOwn ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "")
              }
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {item.species || "Okänd art"}
                {item.angler_name && (
                  <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                    {" "}
                    · {item.angler_name}
                  </span>
                )}
              </span>

              <span className="flex shrink-0 items-center gap-2">
                <span className="text-right text-sm whitespace-nowrap">
                  {item.length_cm != null ? `${item.length_cm} cm` : "–"}
                  <br />
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {item.weight_kg != null ? `${formatSv(item.weight_kg)} kg` : "–"}
                  </span>
                </span>
                {isOwn && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <ConfirmDeleteButton
                      action={deleteCatch}
                      id={item.id}
                      label="Ta bort fångst"
                      compact
                    />
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-sm font-medium">
        Totalt: {roundTo2(totalLength)} cm · {formatSv(totalWeight)} kg
      </p>
    </div>
  );
}
