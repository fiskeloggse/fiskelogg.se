import { updateStatsWidgets } from "@/app/actions/stats";
import { STATS_WIDGETS } from "@/lib/constants";

export default function StatsSettingsForm({
  selected,
}: {
  selected: readonly string[];
}) {
  return (
    <details className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      <summary className="cursor-pointer text-sm font-medium">
        Anpassa vy
      </summary>
      <form action={updateStatsWidgets} className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STATS_WIDGETS.map((widget) => (
            <label key={widget.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="widgets"
                value={widget.key}
                defaultChecked={selected.includes(widget.key)}
              />
              {widget.label}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Spara
        </button>
      </form>
    </details>
  );
}
