"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

export async function updatePreferences(formData: FormData) {
  const user = await requireUser();
  const showBingo = formData.get("show_bingo") === "on";

  await sql`update users set show_bingo = ${showBingo} where id = ${user.id}`;

  revalidatePath("/", "layout");
}
