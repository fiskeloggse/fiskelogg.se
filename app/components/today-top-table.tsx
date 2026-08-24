"use client";

import { useRouter } from "next/navigation";
import { deleteCatch } from "@/app/actions/catches";
import ConfirmDeleteButton from "./confirm-delete-button";
import type { Catch } from "./catch-list";

const ROWS = 5;
const cellClass = "border border-black/10 px-2 py-1.5 dark:border-white/15";
const headClass = cellClass + " font-medium text-zinc-500 dark:text-zinc-400";

function formatSv(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

function formatMeasurement(item: Catch): string {
  const len = item.length_cm != null ? String(item.length_cm) : "-";
  const wt = item.weight_kg != null ? formatSv(item.weight_kg) : "-";
  return `${len} / ${wt}`;
}

function CatchCells({
  item,
  currentUserId,
  router,
}: {
  item: Catch | null;
  currentUserId: number;
  router: ReturnType<typeof useRouter>;
}) {
  if (!item) {
    return (
      <>
        <td className={cellClass}>&nbsp;</td>
        <td className={cellClass}>&nbsp;</td>
      </>
    );
  }

  const isOwn = item.user_id === currentUserId;
  const clickable = isOwn
    ? cellClass + " cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
    : cellClass;

  return (
    <>
      <td
        className={clickable}
        onClick={isOwn ? () => router.push(`/register/${item.id}`) : undefined}
      >
        {item.species || "Okänd art"}
      </td>
      <td
        className={clickable}
        onClick={isOwn ? () => router.push(`/register/${item.id}`) : undefined}
      >
        <span className="flex items-center justify-between gap-1.5">
          {formatMeasurement(item)}
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
      </td>
    </>
  );
}

export default function TodayTopTable({
  personalCatches,
  teamCatches,
  teamName,
  currentUserId,
}: {
  personalCatches: Catch[];
  teamCatches: Catch[] | null;
  teamName: string;
  currentUserId: number;
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th
              colSpan={2}
              className={headClass + " bg-black/[0.03] text-center dark:bg-white/5"}
            >
              Mina fångster
            </th>
            {teamCatches && (
              <th
                colSpan={2}
                className={headClass + " bg-black/[0.03] text-center dark:bg-white/5"}
              >
                {teamName}
              </th>
            )}
          </tr>
          <tr>
            <th className={headClass}>Art</th>
            <th className={headClass}>Längd / vikt</th>
            {teamCatches && (
              <>
                <th className={headClass}>Art</th>
                <th className={headClass}>Längd / vikt</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, i) => (
            <tr key={i}>
              <CatchCells
                item={personalCatches[i] ?? null}
                currentUserId={currentUserId}
                router={router}
              />
              {teamCatches && (
                <CatchCells
                  item={teamCatches[i] ?? null}
                  currentUserId={currentUserId}
                  router={router}
                />
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
