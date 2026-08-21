"use client";

import { useRouter } from "next/navigation";
import { deleteCatch } from "@/app/actions/catches";
import ConfirmDeleteButton from "./confirm-delete-button";
import type { Catch } from "./catch-list";

function formatCaughtAt(date: Date) {
  return date.toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

  const measurements = [
    item.length_cm != null ? `${item.length_cm} cm` : null,
    item.weight_kg != null ? `${item.weight_kg} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const place = [item.lake, item.location].filter(Boolean).join(", ");

  return (
    <li
      onClick={isOwn ? () => router.push(`/register/${item.id}`) : undefined}
      className={
        "flex items-center justify-between gap-2 px-3 py-2 " +
        (isOwn ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : "")
      }
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
        <span className="truncate font-medium">
          {item.species || "Okänd art"}
        </span>
        {item.angler_name && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {item.angler_name}
          </span>
        )}
        {measurements && (
          <span className="text-zinc-500 dark:text-zinc-400">
            {measurements}
          </span>
        )}
        {place && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {place}
          </span>
        )}
        {item.bait && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {item.bait}
          </span>
        )}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {formatCaughtAt(item.caught_at)}
        </span>
      </div>

      {isOwn && (
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ConfirmDeleteButton
            action={deleteCatch}
            id={item.id}
            label="Ta bort fångst"
            compact
          />
        </div>
      )}
    </li>
  );
}
