"use client";

import { DateColumnFilter, SelectColumnFilter, SortToggle } from "./register-header-filters";

export default function FiskepassFilterBar({
  targetSpeciesOptions,
  years,
}: {
  targetSpeciesOptions: string[];
  years: number[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <DateColumnFilter years={years} showMonthFilter={false} />
      <SelectColumnFilter
        label="Typ"
        paramName="typ"
        options={["Ensam", "Team"]}
        sortAsc="typ-asc"
        sortDesc="typ-desc"
        sortAscLabel="Ensam först"
        sortDescLabel="Team först"
      />
      {targetSpeciesOptions.length > 0 && (
        <SelectColumnFilter
          label="Målart"
          paramName="malart"
          options={targetSpeciesOptions}
          sortAsc="malart-asc"
          sortDesc="malart-desc"
        />
      )}
      <SortToggle label="Fångster" sortAsc="catches-asc" sortDesc="catches-desc" />
    </div>
  );
}
