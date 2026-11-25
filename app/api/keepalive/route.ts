import sql from "@/lib/db";

// Hit daily by the Vercel cron in vercel.json. Supabase's free tier pauses a
// project after 7 days without database activity -- a quiet week in the
// beta would otherwise take the whole app down until someone unpauses it by
// hand. A real query against a table (not just opening a connection) is
// what counts as activity.
export async function GET(request: Request) {
  // Vercel sends this header automatically once CRON_SECRET is set in the
  // project's environment variables. Without it set the route stays open --
  // it only runs a harmless count.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await sql`select count(*) from users`;
  return new Response("ok");
}
