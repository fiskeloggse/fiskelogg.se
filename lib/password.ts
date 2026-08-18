import "server-only";
import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const storedBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = crypto.scryptSync(password, salt, KEY_LENGTH);

  if (storedBuffer.length !== suppliedBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, suppliedBuffer);
}
