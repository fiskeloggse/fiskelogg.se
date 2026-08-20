"use client";

import { useState } from "react";
import { updateVisibleColumns } from "@/app/actions/preferences";
import { REGISTER_COLUMNS } from "@/lib/constants";
import { HeaderPopover } from "./register-header-filters";

export default function ColumnVisibilityToggle({
  visible,
}: {
  visible: readonly string[];
}) {
  const [selected, setSelected] = useState<string[]>([...visible]);
  const active = selected.length < REGISTER_COLUMNS.length;

  return (
    <HeaderPopover
      label="Kolumner"
      active={active}
      triggerClassName="text-zinc-500 underline hover:text-foreground dark:text-zinc-400"
    >
      {(close) => (
        <form
          action={async (formData) => {
            await updateVisibleColumns(formData);
            close();
          }}
          className="flex flex-col gap-2 text-sm"
        >
          {REGISTER_COLUMNS.map((col) => (
            <label key={col.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="columns"
                value={col.key}
                checked={selected.includes(col.key)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, col.key]
                      : prev.filter((k) => k !== col.key)
                  )
                }
              />
              {col.label}
            </label>
          ))}
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          >
            Spara
          </button>
        </form>
      )}
    </HeaderPopover>
  );
}
