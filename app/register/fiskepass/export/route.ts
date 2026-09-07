import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/dal";
import { getFiskepassHistory, parseFiskepassFilters } from "@/lib/fiskepass";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseFiskepassFilters(url.searchParams);
  const history = await getFiskepassHistory(user.id, filters);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Fiskepass");
  sheet.columns = [
    { header: "Start", key: "start", width: 18 },
    { header: "Stopp", key: "stop", width: 18 },
    { header: "Typ", key: "typ", width: 10 },
    { header: "Målart", key: "malart", width: 20 },
    { header: "Antal fångster", key: "catchCount", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const pass of history) {
    const row = sheet.addRow({
      start: pass.start_time,
      stop: pass.stop_time,
      typ: pass.team_id ? "Team" : "Ensam",
      malart: pass.target_species?.join(", ") ?? "",
      catchCount: pass.catch_count,
    });
    row.getCell("start").numFmt = "yyyy-mm-dd hh:mm";
    if (pass.stop_time) row.getCell("stop").numFmt = "yyyy-mm-dd hh:mm";
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="fiskepass.xlsx"',
    },
  });
}
