import "server-only";
import postgres from "postgres";

// Reuse the connection across hot reloads in dev and across warm
// serverless invocations in production instead of opening a new one
// per import.
declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL saknas i miljövariablerna.");
}

const sql =
  global.__sql ??
  postgres(connectionString, {
    // Required when connecting through Supabase's transaction pooler
    // (PgBouncer), which doesn't support prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}

export default sql;
