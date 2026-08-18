import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from "./session-token";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagar

export async function createSession(userId: number) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = signSession({ userId, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
