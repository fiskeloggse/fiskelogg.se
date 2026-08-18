import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL saknas. Lägg till den i .env.local.");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });
const schema = readFileSync(
  path.join(process.cwd(), "db", "schema.sql"),
  "utf8"
);

await sql.unsafe(schema);
console.log("Databasschema uppdaterat.");
await sql.end();
