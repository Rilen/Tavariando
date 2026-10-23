import "server-only";
import { headers } from "next/headers";

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_PATTERN = /^[0-9a-f:]+$/i;

export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const candidate =
    forwardedFor?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    "";

  if (
    candidate.length <= 64 &&
    (IPV4_PATTERN.test(candidate) || IPV6_PATTERN.test(candidate))
  ) {
    return candidate;
  }

  return "unknown";
}
