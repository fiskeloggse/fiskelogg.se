"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { parseCatchWorkbook, type ImportRowError } from "@/lib/catch-import";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type ImportState =
  | { error: string }
  | { imported: number; errors: ImportRowError[] }
  | undefined;

export async function importCatches(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Välj en fil att ladda upp." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Filen är för stor (max 5 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsedResult = await parseCatchWorkbook(buffer);

  if (!parsedResult.ok) {
    return { error: parsedResult.fatalError };
  }

  const { rows, errors } = parsedResult;

  if (rows.length > 0) {
    await sql.begin(async (tx) => {
      for (const row of rows) {
        await tx`
          insert into catches (user_id, species, length_cm, weight_kg, lake, location, bait, caught_at)
          values (
            ${user.id}, initcap(${row.species}), ${row.lengthCm ?? null}, ${row.weightKg ?? null},
            ${row.lake ?? null}, ${row.location ?? null}, ${row.bait ?? null}, ${row.caughtAt}
          )
        `;
      }
    });

    revalidatePath("/");
    revalidatePath("/challenges");
    revalidatePath("/register");
    revalidatePath("/statistik");
  }

  return { imported: rows.length, errors };
}
