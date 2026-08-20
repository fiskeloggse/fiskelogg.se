"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";

function parseIds(formData: FormData): number[] {
  return formData
    .getAll("ids")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

export async function restoreCatches(formData: FormData) {
  const user = await requireUser();
  const ids = parseIds(formData);
  if (ids.length === 0) return;

  await sql`
    update catches set deleted_at = null
    where user_id = ${user.id} and id = any(${sql.array(ids)}::int[]) and deleted_at is not null
  `;

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/personbasta");
  revalidatePath("/register");
  revalidatePath("/register/papperskorg");
  revalidatePath("/statistik");
}

export async function permanentlyDeleteCatches(formData: FormData) {
  const user = await requireUser();
  const ids = parseIds(formData);
  if (ids.length === 0) return;

  await sql`
    delete from catches
    where user_id = ${user.id} and id = any(${sql.array(ids)}::int[]) and deleted_at is not null
  `;

  revalidatePath("/register/papperskorg");
}
