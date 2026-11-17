import { describe, expect, it } from "vitest";
import { signRequest, verifyRequest } from "./signing";

const secret = "test-secret";
const body = '{"hello":"world"}';
const timestamp = "1700000000";
// HMAC-SHA256("1700000000." + body), computed with openssl.
const knownSignature =
  "f85455a1b55ea86f7a15f5f9923d0abc4b888da84ec485f2ff358f427776beca";
const at = (seconds: number) => new Date(seconds * 1000);

describe("signRequest", () => {
  it("signs timestamp + body with HMAC-SHA256", () => {
    expect(signRequest({ secret, body, now: at(1_700_000_000) })).toEqual({
      "X-RN-Timestamp": timestamp,
      "X-RN-Signature": knownSignature,
    });
  });
});

describe("verifyRequest", () => {
  const verify = (overrides: Partial<Parameters<typeof verifyRequest>[0]>) =>
    verifyRequest({
      secret,
      body,
      timestamp,
      signature: knownSignature,
      now: at(1_700_000_000),
      ...overrides,
    });

  it("accepts a correctly signed, fresh request", () => {
    expect(verify({})).toEqual({ ok: true });
  });

  it("accepts a request signed with signRequest", () => {
    const headers = signRequest({ secret, body: "{}", now: at(1_800_000_000) });
    expect(
      verify({
        body: "{}",
        timestamp: headers["X-RN-Timestamp"],
        signature: headers["X-RN-Signature"],
        now: at(1_800_000_000),
      }),
    ).toEqual({ ok: true });
  });

  it("rejects a tampered body", () => {
    expect(verify({ body: '{"hello":"there"}' })).toEqual({
      ok: false,
      error: "bad signature",
    });
  });

  it("rejects a signature made with another secret", () => {
    expect(verify({ secret: "other-secret" })).toEqual({
      ok: false,
      error: "bad signature",
    });
  });

  it("rejects missing headers", () => {
    expect(verify({ signature: null })).toEqual({
      ok: false,
      error: "missing signature headers",
    });
    expect(verify({ timestamp: null })).toEqual({
      ok: false,
      error: "missing signature headers",
    });
  });

  it("rejects a non-numeric timestamp", () => {
    expect(verify({ timestamp: "yesterday" })).toEqual({
      ok: false,
      error: "bad timestamp",
    });
  });

  it("accepts clock skew up to 5 minutes either way", () => {
    expect(verify({ now: at(1_700_000_000 + 300) })).toEqual({ ok: true });
    expect(verify({ now: at(1_700_000_000 - 300) })).toEqual({ ok: true });
  });

  it("rejects requests more than 5 minutes old or ahead", () => {
    expect(verify({ now: at(1_700_000_000 + 301) })).toEqual({
      ok: false,
      error: "stale timestamp",
    });
    expect(verify({ now: at(1_700_000_000 - 301) })).toEqual({
      ok: false,
      error: "stale timestamp",
    });
  });
});
