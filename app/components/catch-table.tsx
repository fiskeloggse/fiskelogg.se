import { deleteCatch } from "@/app/actions/catches";
import type { Catch } from "./catch-list";
import ConfirmDeleteButton from "./confirm-delete-button";

function formatDate(date: Date) {
  return date.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function roundTo2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function CatchTable({
  catches,
  currentUserId,
}: {
  catches: Catch[];
  currentUserId: number;
}) {
  if (catches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        Inga fångster matchar filtret.
      </p>
    );
  }

  const totalLength = catches.reduce((sum, c) => sum + (c.length_cm ?? 0), 0);
  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_kg ?? 0), 0);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-zinc-400 sm:hidden dark:text-zinc-500">
        ← Bläddra sidledes för fler kolumner →
      </p>
      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
        <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            <th className="px-4 py-2 font-medium">Datum</th>
            <th className="px-4 py-2 font-medium">Art</th>
            <th className="px-4 py-2 font-medium">Plats</th>
            <th className="px-4 py-2 text-right font-medium">Längd (cm)</th>
            <th className="px-4 py-2 text-right font-medium">Vikt (kg)</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/10">
          {catches.map((item) => {
            const place = [item.lake, item.location].filter(Boolean).join(", ");
            return (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                  {formatDate(item.caught_at)}
                </td>
                <td className="px-4 py-2">
                  {item.species || "Okänd art"}
                  {item.angler_name && (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      {" "}
                      · {item.angler_name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                  {place || "–"}
                </td>
                <td className="px-4 py-2 text-right">{item.length_cm ?? "–"}</td>
                <td className="px-4 py-2 text-right">{item.weight_kg ?? "–"}</td>
                <td className="px-4 py-2 text-right">
                  {item.user_id === currentUserId && (
                    <ConfirmDeleteButton
                      action={deleteCatch}
                      id={item.id}
                      label="Ta bort fångst"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-black/10 font-medium dark:border-white/15">
            <td className="px-4 py-2" colSpan={3}>
              Totalt
            </td>
            <td className="px-4 py-2 text-right">{roundTo2(totalLength)} cm</td>
            <td className="px-4 py-2 text-right">{roundTo2(totalWeight)} kg</td>
            <td className="px-4 py-2" />
          </tr>
        </tfoot>
        </table>
      </div>
    </div>
  );
}
