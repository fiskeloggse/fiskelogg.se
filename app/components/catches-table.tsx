"use client";

import { useRouter } from "next/navigation";
import type { Catch } from "./catch-list";

const ROWS = 5;

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
  divider,
  router,
}: {
  item: Catch | null;
  currentUserId: number;
  divider: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const firstCellClass = "py-1.5 pr-2 pl-2" + (divider ? " border-l border-black/10 dark:border-white/15" : "");

  if (!item) {
    return (
      <>
        <td className={firstCellClass}>&nbsp;</td>
        <td className="px-2 py-1.5">&nbsp;</td>
      </>
    );
  }

  const isOwn = item.user_id === currentUserId;
  const rowClass = isOwn ? "cursor-pointer" : "";
  const onClick = isOwn ? () => router.push(`/register/${item.id}`) : undefined;

  return (
    <>
      <td className={firstCellClass + " " + rowClass} onClick={onClick}>
        <span className="truncate">{item.species || "Okänd art"}</span>
      </td>
      <td className={"px-2 py-1.5 " + rowClass} onClick={onClick}>
        {formatMeasurement(item)}
      </td>
    </>
  );
}

export default function CatchesTable({
  title,
  headerExtra,
  personalCatches,
  teamCatches,
  teamName,
  currentUserId,
}: {
  title: string;
  headerExtra?: React.ReactNode;
  personalCatches: Catch[];
  teamCatches: Catch[] | null;
  teamName: string;
  currentUserId: number;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {headerExtra}
      </div>
      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              <th colSpan={2} className="bg-black/[0.03] px-2 py-1.5 text-center dark:bg-white/5">
                Mina fångster
              </th>
              {teamCatches && (
                <th
                  colSpan={2}
                  className="border-l border-black/10 bg-black/[0.03] px-2 py-1.5 text-center dark:border-white/15 dark:bg-white/5"
                >
                  {teamName}
                </th>
              )}
            </tr>
            <tr className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <th className="px-2 py-1 font-medium">Art</th>
              <th className="px-2 py-1 font-medium">Längd / vikt</th>
              {teamCatches && (
                <>
                  <th className="border-l border-black/10 px-2 py-1 font-medium dark:border-white/15">
                    Art
                  </th>
                  <th className="px-2 py-1 font-medium">Längd / vikt</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {Array.from({ length: ROWS }).map((_, i) => (
              <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <CatchCells
                  item={personalCatches[i] ?? null}
                  currentUserId={currentUserId}
                  divider={false}
                  router={router}
                />
                {teamCatches && (
                  <CatchCells
                    item={teamCatches[i] ?? null}
                    currentUserId={currentUserId}
                    divider
                    router={router}
                  />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
