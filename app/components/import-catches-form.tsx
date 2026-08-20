"use client";

import { useActionState } from "react";
import { importCatches, type ImportState } from "@/app/actions/import-catches";

export default function ImportCatchesForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importCatches,
    undefined
  );

  const errorMessage = state && "error" in state ? state.error : undefined;
  const result = state && "imported" in state ? state : undefined;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Importera från Excel</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-foreground dark:text-zinc-400"
        >
          Avbryt
        </button>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Ladda ner mallen, fyll i dina fångster och ladda sedan upp filen.
      </p>

      <a
        href="/fangst-mall.xlsx"
        download
        className="self-start rounded-full border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Ladda ner mall
      </a>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          Fil (.xlsx)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,.xls"
          required
          className="text-sm file:mr-3 file:rounded-full file:border file:border-black/10 file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:border-white/15"
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-1.5 text-sm">
          <p>
            {result.imported}{" "}
            {result.imported === 1 ? "fångst importerad." : "fångster importerade."}
          </p>
          {result.errors.length > 0 && (
            <div className="text-amber-700 dark:text-amber-400">
              <p>{result.errors.length} rader hoppades över:</p>
              <ul className="list-disc pl-5">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Rad {e.row}: {e.message}
                  </li>
                ))}
              </ul>
              {result.errors.length > 10 && (
                <p>…och {result.errors.length - 10} till.</p>
              )}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Importerar…" : "Importera"}
      </button>
    </form>
  );
}
