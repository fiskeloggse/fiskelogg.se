"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import {
  QUICK_LOG_FIELD_KEYS,
  REGISTER_COLUMN_KEYS,
  type QuickLogFieldKey,
  type RegisterColumnKey,
} from "@/lib/constants";

export async function updatePreferences(formData: FormData) {
  const user = await requireUser();
  const showBingo = formData.get("show_bingo") === "on";
  const gpsDefaultEnabled = formData.get("gps_default_enabled") === "on";

  await sql`
    update users set show_bingo = ${showBingo}, gps_default_enabled = ${gpsDefaultEnabled}
    where id = ${user.id}
  `;

  revalidatePath("/", "layout");
}

export async function updateQuickLogFields(formData: FormData) {
  const user = await requireUser();
  const selected = formData
    .getAll("fields")
    .map(String)
    .filter((key): key is QuickLogFieldKey =>
      (QUICK_LOG_FIELD_KEYS as readonly string[]).includes(key)
    );

  await sql`update users set quick_log_fields = ${sql.array(selected)} where id = ${user.id}`;

  revalidatePath("/", "layout");
}

export async function updateVisibleColumns(formData: FormData) {
  const user = await requireUser();
  const selected = formData
    .getAll("columns")
    .map(String)
    .filter((key): key is RegisterColumnKey =>
      (REGISTER_COLUMN_KEYS as readonly string[]).includes(key)
    );

  await sql`update users set visible_register_columns = ${sql.array(selected)} where id = ${user.id}`;

  revalidatePath("/register");
}
