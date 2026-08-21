import ExcelJS from "exceljs";
import path from "node:path";

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Fångster");

sheet.columns = [
  { header: "Art", key: "species", width: 16 },
  { header: "Längd (cm)", key: "lengthCm", width: 12 },
  { header: "Vikt (kg)", key: "weightKg", width: 11 },
  { header: "Vatten", key: "lake", width: 16 },
  { header: "Plats", key: "location", width: 16 },
  { header: "Bete", key: "bait", width: 14 },
  { header: "Kommentar", key: "comment", width: 24 },
  { header: "Datum", key: "caughtAt", width: 12 },
];

sheet.getRow(1).font = { bold: true };

const exampleRow = sheet.addRow({
  species: "Gädda",
  lengthCm: 75,
  weightKg: 3.2,
  lake: "Vättern",
  location: "Bryggan",
  bait: "Wobbler",
  comment: "Tog på fallande vatten",
  caughtAt: new Date(2026, 5, 15),
});
exampleRow.getCell("caughtAt").numFmt = "yyyy-mm-dd";

await workbook.xlsx.writeFile(
  path.join(process.cwd(), "public", "fangst-mall.xlsx")
);
console.log("Mall skriven till public/fangst-mall.xlsx");
