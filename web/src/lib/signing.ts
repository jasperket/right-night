import { createHmac, timingSafeEqual } from "node:crypto";

// Signs app ⇄ n8n calls (ADR 0002): HMAC-SHA256 of `${timestamp}.${rawBody}`.

export const TIMESTAMP_HEADER = "X-RN-Timestamp";
export const SIGNATURE_HEADER = "X-RN-Signature";
const MAX_SKEW_SECONDS = 5 * 60;

function hmac(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function signRequest(input: { secret: string; body: string; now?: Date }) {
  const timestamp = String(Math.floor((input.now ?? new Date()).getTime() / 1000));
  return {
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: hmac(input.secret, timestamp, input.body),
  } as { "X-RN-Timestamp": string; "X-RN-Signature": string };
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

export function verifyRequest(input: {
  secret: string;
  body: string;
  timestamp: string | null;
  signature: string | null;
  now?: Date;
}): VerifyResult {
  const { timestamp, signature } = input;
  if (!timestamp || !signature) return { ok: false, error: "missing signature headers" };
  if (!/^\d+$/.test(timestamp)) return { ok: false, error: "bad timestamp" };

  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_SKEW_SECONDS) {
    return { ok: false, error: "stale timestamp" };
  }

  const expected = Buffer.from(hmac(input.secret, timestamp, input.body), "hex");
  const given = Buffer.from(signature, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, error: "bad signature" };
  }
  return { ok: true };
}
