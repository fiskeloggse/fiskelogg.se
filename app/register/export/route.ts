import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/dal";
import { getFilteredCatches, parseRegisterFilters } from "@/lib/register-catches";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseRegisterFilters(url.searchParams);
  const catches = await getFilteredCatches(user.id, filters);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Fångster");
  sheet.columns = [
    { header: "Art", key: "species", width: 16 },
    { header: "Längd (cm)", key: "lengthCm", width: 12 },
    { header: "Vikt (kg)", key: "weightKg", width: 11 },
    { header: "Vatten", key: "lake", width: 16 },
    { header: "Plats", key: "location", width: 16 },
    { header: "Bete", key: "bait", width: 14 },
    { header: "Datum", key: "caughtAt", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const c of catches) {
    const row = sheet.addRow({
      species: c.species,
      lengthCm: c.length_cm,
      weightKg: c.weight_kg,
      lake: c.lake,
      location: c.location,
      bait: c.bait,
      caughtAt: c.caught_at,
    });
    row.getCell("caughtAt").numFmt = "yyyy-mm-dd hh:mm";
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="fangster.xlsx"',
    },
  });
}
