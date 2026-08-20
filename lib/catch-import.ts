import "server-only";
import ExcelJS from "exceljs";
import * as z from "zod";

export const IMPORT_TEMPLATE_HEADERS = [
  "Art",
  "Längd (cm)",
  "Vikt (kg)",
  "Sjö",
  "Plats",
  "Bete",
  "Datum",
] as const;

const RowSchema = z
  .object({
    species: z.string().trim().min(1, { error: "Art saknas." }).max(100),
    lengthCm: z.coerce
      .number({ error: "Ogiltig längd." })
      .int({ error: "Längden anges i hela cm." })
      .positive({ error: "Längden måste vara större än noll." })
      .max(1000, { error: "Orimligt stor längd." })
      .optional(),
    weightKg: z.coerce
      .number({ error: "Ogiltig vikt." })
      .positive({ error: "Vikten måste vara större än noll." })
      .max(1000, { error: "Orimligt stor vikt." })
      .optional(),
    lake: z.string().trim().max(100).optional(),
    location: z.string().trim().max(100).optional(),
    bait: z.string().trim().max(100).optional(),
    caughtAt: z.coerce
      .date({ error: "Ogiltigt eller saknat datum." })
      .max(new Date(), { error: "Datumet kan inte vara i framtiden." }),
  })
  .refine((data) => data.lengthCm !== undefined || data.weightKg !== undefined, {
    error: "Ange antingen längd eller vikt.",
    path: ["lengthCm"],
  });

export type ParsedCatchRow = z.infer<typeof RowSchema>;

export type ImportRowError = { row: number; message: string };

export type ParsedImport =
  | { ok: true; rows: ParsedCatchRow[]; errors: ImportRowError[] }
  | { ok: false; fatalError: string };

function toOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

function toCaughtAtInput(value: unknown): Date | string | undefined {
  if (value instanceof Date) return value;
  return toOptionalString(value);
}

export async function parseCatchWorkbook(
  buffer: Buffer
): Promise<ParsedImport> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's bundled types predate Node's generic Buffer<T> signature.
    await workbook.xlsx.load(
      buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
    );
  } catch {
    return { ok: false, fatalError: "Kunde inte läsa filen. Ladda ner mallen och försök igen." };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 1) {
    return { ok: false, fatalError: "Hittade inget kalkylblad i filen." };
  }

  const headerRow = sheet.getRow(1);
  const columnByHeader = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const text = toOptionalString(cell.value);
    if (text) columnByHeader.set(text, colNumber);
  });

  const requiredHeaders = ["Art", "Datum"] as const;
  const missingHeaders = requiredHeaders.filter((h) => !columnByHeader.has(h));
  if (missingHeaders.length > 0) {
    return {
      ok: false,
      fatalError: `Hittade inte kolumnen/kolumnerna ${missingHeaders.join(", ")}. Använd mallen.`,
    };
  }

  function cellByHeader(row: ExcelJS.Row, header: string): unknown {
    const col = columnByHeader.get(header);
    if (!col) return undefined;
    const cell = row.getCell(col);
    return cell.value;
  }

  const rows: ParsedCatchRow[] = [];
  const errors: ImportRowError[] = [];

  const lastRow = sheet.rowCount;
  if (lastRow - 1 > 1000) {
    return { ok: false, fatalError: "Max 1000 rader per import. Dela upp filen." };
  }

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0) continue;

    const species = toOptionalString(cellByHeader(row, "Art"));
    const caughtAt = toCaughtAtInput(cellByHeader(row, "Datum"));
    // Skip fully blank rows (e.g. leftover formatted rows from the template)
    // instead of reporting them as errors.
    if (species === undefined && caughtAt === undefined) continue;

    const parsed = RowSchema.safeParse({
      species: species ?? "",
      lengthCm: toOptionalString(cellByHeader(row, "Längd (cm)")),
      weightKg: toOptionalString(cellByHeader(row, "Vikt (kg)")),
      lake: toOptionalString(cellByHeader(row, "Sjö")),
      location: toOptionalString(cellByHeader(row, "Plats")),
      bait: toOptionalString(cellByHeader(row, "Bete")),
      caughtAt,
    });

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues[0]?.message ?? "Ogiltig rad.",
      });
      continue;
    }

    rows.push(parsed.data);
  }

  return { ok: true, rows, errors };
}
