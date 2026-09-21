import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/dal";
import { getFilteredCatches, parseRegisterFilters } from "@/lib/register-catches";
import { windDirLabel } from "@/lib/constants";
import { getMoonPhase } from "@/lib/moon-phase";

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
    { header: "Fiskemetod", key: "method", width: 16 },
    { header: "Bete", key: "bait", width: 14 },
    { header: "Vattentemperatur (°C)", key: "waterTempC", width: 18 },
    { header: "Väder", key: "weatherDescription", width: 16 },
    { header: "Lufttemperatur (°C)", key: "weatherTempC", width: 16 },
    { header: "Vind (m/s)", key: "windMs", width: 11 },
    { header: "Vindriktning", key: "windDir", width: 12 },
    { header: "Lufttryck (hPa)", key: "pressure", width: 14 },
    { header: "Molnighet (%)", key: "cloudPct", width: 13 },
    { header: "Månfas", key: "moonPhase", width: 14 },
    { header: "Latitud", key: "latitude", width: 12 },
    { header: "Longitud", key: "longitude", width: 12 },
    { header: "Kommentar", key: "comment", width: 24 },
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
      method: c.method,
      bait: c.bait,
      waterTempC: c.water_temp_c,
      weatherDescription: c.weather_description,
      weatherTempC: c.weather_temp_c,
      windMs:
        c.weather_wind_kmh != null ? Math.round(c.weather_wind_kmh / 3.6) : null,
      windDir:
        c.weather_wind_dir_deg != null ? windDirLabel(c.weather_wind_dir_deg) : null,
      pressure: c.weather_pressure_hpa,
      cloudPct: c.weather_cloud_pct,
      moonPhase: getMoonPhase(c.caught_at).label,
      latitude: c.latitude,
      longitude: c.longitude,
      comment: c.comment,
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
