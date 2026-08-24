"use client";

import { useRouter } from "next/navigation";
import { deleteCatch } from "@/app/actions/catches";
import ConfirmDeleteButton from "./confirm-delete-button";
import type { Catch } from "./catch-list";

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

// Just a clock time for today's catches — the date only matters once it's
// not today, and even then a short "24 aug" is enough for a homepage glance.
function formatShort(date: Date) {
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function CatchListItem({
  item,
  currentUserId,
}: {
  item: Catch;
  currentUserId: number;
}) {
  const router = useRouter();
  const isOwn = item.user_id === currentUserId;

  return (
    <li
      onClick={isOwn ? () => router.push(`/register/${item.id}`) : undefined}
      className={
        "flex items-center justify-between gap-2 px-2.5 py-1.5 " +
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

      <span className="flex shrink-0 items-center gap-1.5">
        <span className="text-right text-sm whitespace-nowrap">
          {item.length_cm != null
            ? `${item.length_cm} cm`
            : item.weight_kg != null
              ? `${formatSv(item.weight_kg)} kg`
              : "–"}
          <br />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {formatShort(item.caught_at)}
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
}
