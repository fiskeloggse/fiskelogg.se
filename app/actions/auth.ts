"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import sql from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  generateResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error: string } | { success: true } | undefined;

const SignupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Namnet måste vara minst 2 tecken." }),
  email: z.email({ error: "Ange en giltig e-postadress." }).trim(),
  password: z
    .string()
    .min(8, { error: "Lösenordet måste vara minst 8 tecken." }),
});

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { name, email, password } = parsed.data;

  const [existing] = await sql`select id from users where email = ${email}`;
  if (existing) {
    return { error: "Det finns redan ett konto med den e-postadressen." };
  }

  const passwordHash = hashPassword(password);
  const [user] = await sql<{ id: number }[]>`
    insert into users (email, name, password_hash)
    values (${email}, ${name}, ${passwordHash})
    returning id
  `;

  await createSession(user.id);
  // "/" renders differently signed-in vs. signed-out. A server-side
  // redirect() here would hand the client a soft navigation, which can
  // reuse the router's cached signed-out payload for "/" and briefly show
  // the landing page instead of the dashboard. Returning success and
  // letting the client do a hard navigation (see SignupForm) sidesteps
  // that entirely.
  return { success: true };
}

const LoginSchema = z.object({
  email: z.email({ error: "Ange en giltig e-postadress." }).trim(),
  password: z.string().min(1, { error: "Ange ditt lösenord." }),
});

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { email, password } = parsed.data;

  const [user] = await sql<{ id: number; password_hash: string }[]>`
    select id, password_hash from users where email = ${email}
  `;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Fel e-postadress eller lösenord." };
  }

  await createSession(user.id);
  // See the comment in signup() above — same reasoning applies here.
  return { success: true };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Ange ditt nuvarande lösenord." }),
    newPassword: z
      .string()
      .min(8, { error: "Det nya lösenordet måste vara minst 8 tecken." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "De nya lösenorden matchar inte.",
    path: ["confirmPassword"],
  });

export async function updatePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const user = await requireUser();

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { currentPassword, newPassword } = parsed.data;

  const [row] = await sql<{ password_hash: string }[]>`
    select password_hash from users where id = ${user.id}
  `;

  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    return { error: "Fel nuvarande lösenord." };
  }

  const passwordHash = hashPassword(newPassword);
  await sql`update users set password_hash = ${passwordHash} where id = ${user.id}`;

  return { success: true };
}

const RequestResetSchema = z.object({
  email: z.email({ error: "Ange en giltig e-postadress." }).trim(),
});

export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = RequestResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { email } = parsed.data;

  const [user] = await sql<{ id: number }[]>`
    select id from users where email = ${email}
  `;

  if (user) {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await sql`
      update users
      set password_reset_token_hash = ${tokenHash}, password_reset_expires_at = ${expiresAt}
      where id = ${user.id}
    `;

    try {
      await sendPasswordResetEmail(email, token);
    } catch (err) {
      console.error("Kunde inte skicka återställningsmejl:", err);
    }
  }

  // Same response whether or not the address has an account, so this form
  // can't be used to check which emails are registered.
  return { success: true };
}

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "Länken saknar en giltig kod." }),
    newPassword: z
      .string()
      .min(8, { error: "Lösenordet måste vara minst 8 tecken." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Lösenorden matchar inte.",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = hashResetToken(token);

  const [user] = await sql<{ id: number }[]>`
    select id from users
    where password_reset_token_hash = ${tokenHash}
      and password_reset_expires_at > now()
  `;

  if (!user) {
    return { error: "Länken är ogiltig eller har gått ut. Begär en ny." };
  }

  const passwordHash = hashPassword(newPassword);
  await sql`
    update users
    set password_hash = ${passwordHash},
      password_reset_token_hash = null,
      password_reset_expires_at = null
    where id = ${user.id}
  `;

  return { success: true };
}
