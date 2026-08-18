import crypto from "node:crypto";

// Kept separate from lib/session.ts (which depends on next/headers) so that
// proxy.ts can verify the session cookie without pulling in server-only APIs.

export const SESSION_COOKIE = "session";

export type SessionPayload = {
  userId: number;
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET saknas i miljövariablerna.");
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${hmac}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [data, hmac] = token.split(".");
  if (!data || !hmac) return null;

  let expected: string;
  try {
    expected = crypto
      .createHmac("sha256", getSecret())
      .update(data)
      .digest("base64url");
  } catch {
    return null;
  }

  const provided = Buffer.from(hmac);
  const expectedBuffer = Buffer.from(expected);
  if (
    provided.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(provided, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    ) as SessionPayload;
    if (
      typeof payload.userId !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
