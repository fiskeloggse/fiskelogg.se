"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteCatch } from "@/app/actions/catches";
import ConfirmDeleteButton from "./confirm-delete-button";
import EditCatchForm from "./edit-catch-form";
import type { Catch } from "./catch-list";

function formatDateFull(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "full", timeStyle: "short" });
}

export default function CatchDetail({ item }: { item: Catch }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editing, setEditing] = useState(false);

  // Query params carry the Register filters/sort that were active when the
  // user clicked into this catch, so navigating back restores them.
  const query = searchParams.toString();
  const backHref = `/register${query ? `?${query}` : ""}`;

  async function handleDelete(formData: FormData) {
    await deleteCatch(formData);
    router.push(backHref);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href={backHref}
          className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
        >
          ← Tillbaka till Register
        </Link>
        <EditCatchForm item={item} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={backHref}
        className="self-start text-sm text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
      >
        ← Tillbaka till Register
      </Link>

      <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-white/5">
        <h2 className="text-2xl font-semibold">{item.species || "Okänd art"}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatDateFull(item.caught_at)}
          {item.angler_name && ` · ${item.angler_name}`}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">Längd</p>
            <p className="text-lg font-medium">
              {item.length_cm != null ? `${item.length_cm} cm` : "–"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400">Vikt</p>
            <p className="text-lg font-medium">
              {item.weight_kg != null ? `${item.weight_kg} kg` : "–"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Sjö</p>
            <p className="text-lg font-medium">{item.lake || "–"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Plats</p>
            <p className="text-lg font-medium">{item.location || "–"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500 dark:text-zinc-400">Bete</p>
            <p className="text-lg font-medium">{item.bait || "–"}</p>
          </div>
          {item.comment && (
            <div className="col-span-2">
              <p className="text-zinc-500 dark:text-zinc-400">Kommentar</p>
              <p className="text-lg font-medium whitespace-pre-wrap">
                {item.comment}
              </p>
            </div>
          )}
          {item.latitude != null && item.longitude != null && (
            <div className="col-span-2">
              <p className="text-zinc-500 dark:text-zinc-400">Position</p>
              <p className="text-lg font-medium">
                <a
                  href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Visa på karta
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Redigera
          </button>
          <ConfirmDeleteButton
            action={handleDelete}
            id={item.id}
            label="Ta bort fångst"
          />
        </div>
      </div>
    </div>
  );
}
