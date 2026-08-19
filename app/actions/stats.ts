"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { STATS_WIDGET_KEYS, type StatsWidgetKey } from "@/lib/constants";

export async function updateStatsWidgets(formData: FormData) {
  const user = await requireUser();
  const selected = formData
    .getAll("widgets")
    .map(String)
    .filter((key): key is StatsWidgetKey =>
      (STATS_WIDGET_KEYS as readonly string[]).includes(key)
    );

  await sql`update users set stats_widgets = ${sql.array(selected)} where id = ${user.id}`;

  revalidatePath("/statistik");
}
