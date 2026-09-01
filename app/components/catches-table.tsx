"use client";

import { useRouter } from "next/navigation";
import type { Catch } from "./catch-list";

const ROWS = 5;

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatSv(n: number): string {
  return roundTo2(n).toString().replace(".", ",");
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
        <td className="py-1.5 pr-2 pl-2">&nbsp;</td>
        <td className="px-2 py-1.5">&nbsp;</td>
      </>
    );
  }

  const isOwn = item.user_id === currentUserId;
  const rowClass = isOwn ? "cursor-pointer" : "";
  const onClick = isOwn ? () => router.push(`/register/${item.id}`) : undefined;

  return (
    <>
      <td className={"py-1.5 pr-2 pl-2 " + rowClass} onClick={onClick}>
        <span className="truncate">{item.species || "Okänd art"}</span>
      </td>
      <td className={"px-2 py-1.5 " + rowClass} onClick={onClick}>
        {formatMeasurement(item)}
      </td>
    </>
  );
}

function CatchesBox({
  label,
  catches,
  currentUserId,
  router,
  showTotal,
}: {
  label: string;
  catches: Catch[];
  currentUserId: number;
  router: ReturnType<typeof useRouter>;
  showTotal?: boolean;
}) {
  const lengths = catches.map((c) => c.length_cm).filter((v) => v != null);
  const weights = catches.map((c) => c.weight_kg).filter((v) => v != null);
  const totalLength = lengths.reduce((sum, v) => sum + v, 0);
  const totalWeight = weights.reduce((sum, v) => sum + v, 0);
  const avgLength = lengths.length > 0 ? totalLength / lengths.length : null;
  const avgWeight = weights.length > 0 ? totalWeight / weights.length : null;

  return (
    <div className="flex-1 overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            <th colSpan={2} className="bg-black/[0.03] px-2 py-1.5 text-center dark:bg-white/5">
              {label}
            </th>
          </tr>
          <tr className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            <th className="px-2 py-1 font-medium">Art</th>
            <th className="px-2 py-1 font-medium">Längd / vikt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/10">
          {Array.from({ length: ROWS }).map((_, i) => (
            <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              <CatchCells item={catches[i] ?? null} currentUserId={currentUserId} router={router} />
            </tr>
          ))}
        </tbody>
        {showTotal && catches.length > 0 && (
          <tfoot className="border-t border-black/10 text-xs font-medium text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            <tr>
              <td className="py-1.5 pr-2 pl-2">Totalt</td>
              <td className="px-2 py-1.5">
                {roundTo2(totalLength)} cm / {formatSv(totalWeight)} kg
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 pl-2">Snitt</td>
              <td className="px-2 py-1.5">
                {avgLength != null ? formatSv(avgLength) : "-"} cm /{" "}
                {avgWeight != null ? formatSv(avgWeight) : "-"} kg
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default function CatchesTable({
  title,
  headerExtra,
  personalCatches,
  teamCatches,
  teamName,
  currentUserId,
  showTotal,
}: {
  title: string;
  headerExtra?: React.ReactNode;
  personalCatches: Catch[];
  teamCatches: Catch[] | null;
  teamName: string;
  currentUserId: number;
  showTotal?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {headerExtra}
      </div>
      <div className="flex gap-3">
        <CatchesBox
          label="Mina fångster"
          catches={personalCatches}
          currentUserId={currentUserId}
          router={router}
          showTotal={showTotal}
        />
        {teamCatches && (
          <CatchesBox
            label={teamName}
            catches={teamCatches}
            currentUserId={currentUserId}
            router={router}
            showTotal={showTotal}
          />
        )}
      </div>
    </div>
  );
}
