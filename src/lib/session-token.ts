import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifySessionToken(
  token: string,
  expectedHash: string,
): boolean {
  const actual = Buffer.from(hashSessionToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
