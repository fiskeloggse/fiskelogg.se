"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import {
  QUICK_LOG_FIELD_KEYS,
  REGISTER_COLUMN_KEYS,
  SHARE_CARD_FIELD_KEYS,
  GPS_MODE_KEYS,
  type QuickLogFieldKey,
  type RegisterColumnKey,
  type ShareCardFieldKey,
  type GpsModeKey,
} from "@/lib/constants";

export async function updateShowBingo(formData: FormData) {
  const user = await requireUser();
  const showBingo = formData.get("show_bingo") === "on";

  await sql`update users set show_bingo = ${showBingo} where id = ${user.id}`;

  revalidatePath("/", "layout");
}

export async function updateShowSpeciesCollection(formData: FormData) {
  const user = await requireUser();
  const showSpeciesCollection = formData.get("show_species_collection") === "on";

  await sql`update users set show_species_collection = ${showSpeciesCollection} where id = ${user.id}`;

  revalidatePath("/challenges");
}

export async function updateShowFiskepass(formData: FormData) {
  const user = await requireUser();
  const showFiskepass = formData.get("show_fiskepass") === "on";

  await sql`update users set show_fiskepass = ${showFiskepass} where id = ${user.id}`;

  revalidatePath("/", "layout");
}

// Saves the feature picks from the first-login guide and marks it seen in
// one write. coalesce() keeps onboarding_completed_at pinned to the first
// time this ran even when the guide is reopened from Konto later.
export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();
  const showBingo = formData.get("show_bingo") === "on";
  const showSpeciesCollection = formData.get("show_species_collection") === "on";
  const showFiskepass = formData.get("show_fiskepass") === "on";

  await sql`
    update users
    set show_bingo = ${showBingo},
        show_species_collection = ${showSpeciesCollection},
        show_fiskepass = ${showFiskepass},
        onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where id = ${user.id}
  `;

  revalidatePath("/", "layout");
}

// Dismissing the guide without picking anything (the welcome step's
// "Hoppa över", or closing the dialog) still marks it seen -- otherwise it
// would just reopen on the next visit to "/" with nothing to skip past.
export async function skipOnboarding() {
  const user = await requireUser();

  await sql`
    update users
    set onboarding_completed_at = coalesce(onboarding_completed_at, now())
    where id = ${user.id}
  `;

  revalidatePath("/", "layout");
}

export async function updateGpsMode(formData: FormData) {
  const user = await requireUser();
  const gpsModeRaw = String(formData.get("gps_mode") ?? "");
  const gpsMode: GpsModeKey = (GPS_MODE_KEYS as readonly string[]).includes(gpsModeRaw)
    ? (gpsModeRaw as GpsModeKey)
    : "off";

  await sql`update users set gps_mode = ${gpsMode} where id = ${user.id}`;

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

export async function updateShareCardFields(formData: FormData) {
  const user = await requireUser();
  const selected = formData
    .getAll("fields")
    .map(String)
    .filter((key): key is ShareCardFieldKey =>
      (SHARE_CARD_FIELD_KEYS as readonly string[]).includes(key)
    );

  await sql`update users set share_card_fields = ${sql.array(selected)} where id = ${user.id}`;

  revalidatePath("/register/[id]", "page");
}

// Toggled straight from a species chip in Artjakten, one species at a time
// -- an array op guarded by `@>` instead of a client-sent full list, so two
// quick toggles in a row can't race and clobber each other.
export async function toggleHiddenSpecies(formData: FormData) {
  const user = await requireUser();
  const species = String(formData.get("species") ?? "").trim();
  const hide = formData.get("hide") === "on";
  if (!species) return;

  await sql`
    update users
    set hidden_species = case
      when ${hide} and not (coalesce(hidden_species, '{}'::text[]) @> array[${species}]::text[])
        then array_append(coalesce(hidden_species, '{}'::text[]), ${species})
      when not ${hide}
        then array_remove(coalesce(hidden_species, '{}'::text[]), ${species})
      else hidden_species
    end
    where id = ${user.id}
  `;

  revalidatePath("/challenges");
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
